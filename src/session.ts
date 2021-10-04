import { Channel, Session, User } from 'koishi';
import { mergeMap, Observable } from 'rxjs';

export type ReplaceSession<T> = T extends Session<
  infer U,
  infer G,
  infer X,
  infer Y
>
  ? SessionRx<U, G, X, Y>
  : T;

export type ReplaceSessionTuple<A extends any[]> = A extends [
  infer L,
  ...infer R
]
  ? [ReplaceSession<L>, ...ReplaceSessionTuple<R>]
  : [];

export type UnionToIntersection<U> = (
  U extends any ? (key: U) => void : never
) extends (key: infer I) => void
  ? I
  : never;
export type Flatten<T, K extends keyof T = keyof T> = UnionToIntersection<T[K]>;
export type InnerKeys<T, K extends keyof T = keyof T> = keyof Flatten<T> &
  keyof Flatten<T, K>;

export class SessionRx<
  U extends User.Field = never,
  G extends Channel.Field = never,
  X extends keyof Session.Events = keyof Session.Events,
  Y extends InnerKeys<Session.Events, X> = InnerKeys<Session.Events, X>
> {
  constructor(public session: Session<U, G, X, Y>) {}
  send(obs: Observable<string>) {
    return obs.pipe(
      mergeMap(async (message) => {
        await this.session.send(message);
        return message;
      }),
    );
  }

  sendQueued(obs: Observable<string>) {
    return obs.pipe(
      mergeMap(async (message) => {
        await this.session.sendQueued(message);
        return message;
      }),
    );
  }
}
