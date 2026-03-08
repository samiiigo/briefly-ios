import { registerRootComponent } from 'expo';

// #region agent log
try {
  const ErrorUtils = (global as any).ErrorUtils;
  if (ErrorUtils) {
    const prev = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      fetch('http://127.0.0.1:7276/ingest/3b8a80c6-5c97-439c-93c0-97e4ed6ba274',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a409d8'},body:JSON.stringify({sessionId:'a409d8',location:'index.ts:globalError',message:'Global error',data:{msg:String(error?.message),stack:(error?.stack||'').slice(0,600)},hypothesisId:'H0',timestamp:Date.now()})}).catch(()=>{});
      if (typeof prev === 'function') prev(error, isFatal);
    });
  }
} catch (_) {}
// #endregion

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
