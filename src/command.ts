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
import {
  filter,
  isObservable,
  lastValueFrom,
  mergeMap,
  Observable,
} from 'rxjs';
import { Awaitable } from './koishi-rx';

export interface ArgvRx<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O = {}
> extends Argv<U, G, A, O> {
  sessionRx?: SessionRx<U, G>;
}

export function argvToRx<
  U extends User.Field = never,
  G extends Channel.Field = never,
  A extends any[] = any[],
  O = {}
>(argv: Argv<U, G, A, O>): ArgvRx<U, G, A, O> {
  return {
    ...argv,
    sessionRx: new SessionRx<U, G>(argv.session),
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
  const actionFun = async (...args: Parameters<Command.Action<U, G, A, O>>) => {
    const result = fun(...args);
    if (!isObservable(result)) {
      return result;
    }
    const [{ session }] = args;
    const sendObs = result.pipe(
      filter((val) => !!val),
      mergeMap((val: string) => session.send(val)),
    );
    try {
      // try to ignore no value error
      await lastValueFrom(sendObs);
    } catch (e) {}
    return;
  };
  return command.action(actionFun, append);
}
