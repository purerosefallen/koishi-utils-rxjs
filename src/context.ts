import { Context, EventMap, Session } from 'koishi';
import { Observable } from 'rxjs';
import { ReplaceSessionTuple, SessionRx } from './session';

export class ContextRx {
  constructor(public ctx: Context) {}

  wrap<K extends keyof EventMap>(
    name: K,
    prepend?: boolean,
  ): Observable<ReplaceSessionTuple<Parameters<EventMap[K]>>> {
    return new Observable<any>((subscriber) => {
      const dispose = this.ctx.on(
        name,
        (...args: any[]): any => {
          if (subscriber.closed) {
            dispose();
            return;
          }
          subscriber.next(
            args.map((arg) =>
              arg instanceof Session ? new SessionRx(arg) : arg,
            ),
          );
        },
        prepend,
      );
    });
  }

  middleware(prepend = false): Observable<SessionRx> {
    return new Observable((subscriber) => {
      const dispose = this.ctx.middleware((session, next) => {
        if (subscriber.closed) {
          dispose();
          return next();
        }
        subscriber.next(new SessionRx(session));
        return next();
      }, prepend);
    });
  }
}
