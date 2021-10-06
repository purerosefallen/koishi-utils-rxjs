import { Context } from 'koishi';
import { filter, map, merge, mergeMap, of } from 'rxjs';
import * as KoishiRx from '../src';
import warpMessage = KoishiRx.warpMessage;

export const name = 'test-plugin';
export function apply(ctx: Context, config: any) {
  const cmd1 = KoishiRx.warpAction(
    ctx.command('my-echo <content:text>'),
    (argv, text) => {
      return of(text, text).pipe(map((v) => v.toString()));
    },
  );
  const rctx = KoishiRx.warpContext(ctx);
  warpMessage(
    merge(
      KoishiRx.wrapCommand(ctx.command('my-echo2 <content:text>')).pipe(
        map((param) => {
          return {
            session: param[0].session,
            message: `${param[0].session.username} said ${param[1]}`,
          };
        }),
      ),
      rctx.wrap('message').pipe(
        filter((param) => param[0].session.userId.toString() === '2184800081'),
        map((param) => ({
          session: param[0].session,
          message: '发现幻樱啦！',
        })),
      ),
    ),
  ).subscribe();
}
