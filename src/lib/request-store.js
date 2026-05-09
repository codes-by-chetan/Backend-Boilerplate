import { AsyncLocalStorage } from "async_hooks";

const requestStore = new AsyncLocalStorage();

export const runWithRequestStore = (context, callback) => requestStore.run(context, callback);

export const getRequestStore = () => requestStore.getStore() || null;
