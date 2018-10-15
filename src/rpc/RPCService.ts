import { Observable } from 'rxjs';

export const RPCServiceType = Symbol.for('RPCServiceType');

/**
 * Abstraction of the RPC service implementations
 */
export interface RPCService {
  rpc(methodName: string, data: any): Observable<any>;
}
