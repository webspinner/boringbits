import React from 'react';
import {SheetsRegistry} from 'react-jss/lib/jss';
import JssProvider from 'react-jss/lib/JssProvider';
import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import {Provider} from 'react-redux';
import {createGenerateClassName} from '@material-ui/core/styles';
import {routerMiddleware, connectRouter} from 'connected-react-router';
import isNode from 'detect-node';
import thunk from 'redux-thunk';
import {Map} from 'immutable';


export default function getAppComponents(dependencies) {

  // Grab the state from a global variable injected into the server-generated HTML
  const preloadedState = dependencies.preloadedState || undefined;
  const composeEnhancers = dependencies.composeEnhancers || compose;

  const App = dependencies.App;
  const reducers = dependencies.reducers;
  let rootReducer;
  let routerReducer;

  const middleware = [];
  if (dependencies.history) {
    middleware.push(routerMiddleware(dependencies.history));
    routerReducer = connectRouter(dependencies.history);
  }
  middleware.push(thunk);

  if (typeof reducers === 'function') {
    rootReducer = !routerReducer ? reducers : function rootWrapper(state, action) {

      let newState = reducers(state, action);

      // test to see if it's from immutable
      if (newState.set && newState.merge) {
        if (newState.get('router')) {
          newState.set('router', routerReducer(state.get('router'), action));
        } else {
          newState = newState.merge(new Map({
            router: routerReducer(undefined, action),
          }));
        }

        newState.router = newState.get('router');
      } else {
        newState.router = routerReducer((state.router) ? state.router : undefined, action);
      }

      return newState;
    };
  } else {
    if (routerReducer) reducers.router = routerReducer;
    rootReducer = combineReducers(reducers);
  }

  const Router = dependencies.Router;
  const enhancer = composeEnhancers(applyMiddleware(...middleware));

  const store = createStore(
    rootReducer,
    preloadedState,
    enhancer
  );

  // Create a new class name generator.
  const generateClassName = createGenerateClassName();
  const sheetsRegistry = new SheetsRegistry();

  // eslint-disable-next-line valid-jsdoc
  /**
   * This meant to be called on the server
   * AFTER MAIN is renedered.
   */
  function getStyleSheets() {
    return sheetsRegistry.toString();
  }

  function Container() {
    return (
      <Provider store={store}>
        <Router>
          <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
            <App />
          </JssProvider>
        </Router>
      </Provider>
    );
  }
  return {
    Container: Container,
    getStyleSheets: getStyleSheets,
    store: store,
  };

};
