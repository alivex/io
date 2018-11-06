import { Observable } from 'rxjs';

/**
 * Abstraction of the RPC service implementations
 */
export interface RPCService {
  rpc(methodName: string, data: any): Observable<any>;
}
