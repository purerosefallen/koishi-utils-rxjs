import { Channel, Command, Context, Session, User } from 'koishi';
import { isObservable, Observable } from 'rxjs';
import { InnerKeys, SessionRx } from './session';
import { ContextRx } from './context';

export type Awaitable<T> = [T] extends [Promise<unknown>] ? T : T | Promise<T>;

export function wrapCommand<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O extends {} = {}
>(command: Command<U, G, A, O>, append?: boolean) {
  return new Observable<Parameters<Command.Action<U, G, A, O>>>(
    (subscriber) => {
      command.action((...args: Parameters<Command.Action<U, G, A, O>>) => {
        subscriber.next(args);
        return;
      }, append);
    },
  );
}

export function warpAction<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O extends {} = {}
>(
  command: Command<U, G, A, O>,
  fun: (
    ...args: Parameters<Command.Action<U, G, A, O>>
  ) => Awaitable<void | string> | Observable<void | string>,
  append?: boolean,
): Command<U, G, A, O> {
  const actionFun = (...args: Parameters<Command.Action<U, G, A, O>>) => {
    const result = fun(...args);
    if (!isObservable(result)) {
      return result;
    }
    const [{ session }] = args;
    result.subscribe({
      next: (val) => {
        if (val) {
          session.send(val);
        }
      },
    });
  };
  return command.action(actionFun, append);
}

export function warpSession<
  U extends User.Field = never,
  G extends Channel.Field = never,
  X extends keyof Session.Events = keyof Session.Events,
  Y extends InnerKeys<Session.Events, X> = InnerKeys<Session.Events, X>
>(session: Session<U, G, X, Y>) {
  return new SessionRx(session);
}

export function warpContext(context: Context) {
  return new ContextRx(context);
}

function getSessionFromSessionOrRx<
  U extends User.Field = never,
  G extends Channel.Field = never,
  X extends keyof Session.Events = keyof Session.Events,
  Y extends InnerKeys<Session.Events, X> = InnerKeys<Session.Events, X>
>(s: Session<U, G, X, Y> | SessionRx<U, G, X, Y>) {
  if (s instanceof SessionRx) {
    return s.session;
  } else {
    return s;
  }
}

export interface SessionAndMessage<
  U extends User.Field = never,
  G extends Channel.Field = never,
  X extends keyof Session.Events = keyof Session.Events,
  Y extends InnerKeys<Session.Events, X> = InnerKeys<Session.Events, X>
> {
  session: Session<U, G, X, Y> | SessionRx<U, G, X, Y>;
  message: string;
  delay?: number;
}

export function warpMessage(obs: Observable<SessionAndMessage>) {
  return obs.subscribe({
    next: (sendObj) =>
      getSessionFromSessionOrRx(sendObj.session).send(sendObj.message),
  });
}

export function warpMessageQueue(
  obs: Observable<SessionAndMessage>,
  defaultDelay?: number,
) {
  return obs.subscribe({
    next: (sendObj) =>
      getSessionFromSessionOrRx(sendObj.session).sendQueued(
        sendObj.message,
        sendObj.delay || defaultDelay,
      ),
  });
}
