import {
  Argv,
  Channel,
  Command,
  NextFunction,
  Session,
  Token,
  User,
} from 'koishi';
import { SessionRx } from './session';
import { isObservable, Observable } from 'rxjs';
import { Awaitable } from './koishi-rx';

export interface ArgvRx<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O = {}
> {
  args?: A;
  options?: O;
  error?: string;
  source?: string;
  initiator?: string;
  terminator?: string;
  session?: SessionRx<U, G>;
  command?: Command<U, G, A, O>;
  rest?: string;
  pos?: number;
  root?: boolean;
  tokens?: Token[];
  name?: string;
  next?: NextFunction;
}

export function argvToRx<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O = {}
>(argv: Argv<U, G, A, O>): ArgvRx<U, G, A, O> {
  return {
    ...argv,
    session: new SessionRx<U, G>(argv.session),
  };
}

export function wrapCommand<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O extends {} = {}
>(command: Command<U, G, A, O>, append?: boolean) {
  return new Observable<[argv: ArgvRx<U, G, A, O>, ...args: A]>(
    (subscriber) => {
      command.action((argv: Argv<U, G, A, O>, ...args: A) => {
        subscriber.next([argvToRx(argv), ...args]);
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
