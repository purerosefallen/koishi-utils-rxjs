import { Channel, Context, Session, User } from 'koishi';
import { mergeMap, Observable } from 'rxjs';
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

export function warpMessage<
  U extends User.Field = never,
  G extends Channel.Field = never,
  X extends keyof Session.Events = keyof Session.Events,
  Y extends InnerKeys<Session.Events, X> = InnerKeys<Session.Events, X>
>(
  obs: Observable<SessionAndMessage<U, G, X, Y>>,
): Observable<SessionAndMessage<U, G, X, Y>> {
  return obs.pipe(
    mergeMap(async (sendObj) => {
      await getSessionFromSessionOrRx<U, G, X, Y>(sendObj.session).send(
        sendObj.message,
      );
      return sendObj;
    }),
  );
}

export function warpMessageQueue<
  U extends User.Field = never,
  G extends Channel.Field = never,
  X extends keyof Session.Events = keyof Session.Events,
  Y extends InnerKeys<Session.Events, X> = InnerKeys<Session.Events, X>
>(
  obs: Observable<SessionAndMessage<U, G, X, Y>>,
  defaultDelay?: number,
): Observable<SessionAndMessage<U, G, X, Y>> {
  return obs.pipe(
    mergeMap(async (sendObj) => {
      await getSessionFromSessionOrRx<U, G, X, Y>(sendObj.session).sendQueued(
        sendObj.message,
        sendObj.delay || defaultDelay,
      );
      return sendObj;
    }),
  );
}
