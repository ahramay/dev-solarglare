// store/index.ts
import { applyMiddleware, combineReducers, compose } from 'redux';
import { thunk } from 'redux-thunk';
import mapReducer from './reducers/bmapSlice';
import { legacy_createStore as createStore } from 'redux';

const rootReducer = combineReducers({
    // Add your reducers here
    bmap: mapReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const composeEnhancers = compose;

const store = createStore(
    rootReducer,
    compose(applyMiddleware(thunk))
);

export default store;
