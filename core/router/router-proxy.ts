export type RouterProxyCallback = <TRequest, TResponse> (
    req?: TRequest,
    res?: TResponse,
    next?: () => void,
) => void;
  
export class RouterProxy {
    public createProxy(
        targetCallback: RouterProxyCallback,
    ) {
        return async <TRequest, TResponse>(
            req: TRequest,
            res: TResponse,
            next: () => void,
        ) => {
            targetCallback(req, res, next);
        };
    }
}