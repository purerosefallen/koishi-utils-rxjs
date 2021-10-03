import { Channel, Session, User } from 'koishi';
import { mergeMap, Observable } from 'rxjs';

export type ReplaceSession<T> = T extends Session ? SessionRx : T;

export type ReplaceSessionTuple<T extends [...any[]]> = {
  [Index in keyof T]: ReplaceSession<T[Index]>;
} & { length: T['length']; map: T['map'] };

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
    return obs.pipe(mergeMap((message) => this.session.send(message)));
  }

  sendQueued(obs: Observable<string>) {
    return obs.pipe(mergeMap((message) => this.session.sendQueued(message)));
  }
}
