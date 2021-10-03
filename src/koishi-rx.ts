import { Channel, Command, Context, Session, User } from 'koishi';
import { isObservable, map, mergeMap, Observable } from 'rxjs';
import { InnerKeys, SessionRx } from './session';
import { ContextRx } from './context';

export type Awaitable<T> = [T] extends [Promise<unknown>] ? T : T | Promise<T>;

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
  return obs.pipe(
    mergeMap((sendObj) =>
      getSessionFromSessionOrRx(sendObj.session).send(sendObj.message),
    ),
  );
}

export function warpMessageQueue(
  obs: Observable<SessionAndMessage>,
  defaultDelay?: number,
) {
  return obs.pipe(
    mergeMap((sendObj) =>
      getSessionFromSessionOrRx(sendObj.session).sendQueued(
        sendObj.message,
        sendObj.delay || defaultDelay,
      ),
    ),
  );
}
