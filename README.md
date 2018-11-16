# hecter
A small library that utilizes the idea of state-charts to manage web app behavior enabling predictable &amp; responsive UIs by executing state transition graphs.

## APIs

> Getters / Triggers: 

let $machine = new HecterMachine(transitionGraph, initialState);

$machine.get( void );
$machine.scheduleNext(eventName, actionData);
$machine.transit(eventName, actionData);
$machine.next( void );
$machine.nextAll( void );
$machine.disconnect();

> Hooks:

Machine.setRerenderHook( Function< state, error > );
Machine.setActionHandlerHook( Function< machine, action> );

## Usage

> **Hecter** can be used with any data flow management tool (e.g. Redux / MobX / Radixx )


```js

/** asyncActions.js */

import axios from 'axios'

const login = (machine, action) => (dispatch, getState) => {

			return axios.get("https://example.com", {}).then(function(data){
				machine.scheduleNext("AJAX_SUCCESS_RESP", null);
				return dispatch({
					type:action.type,
					data:data
				});
			}).catch(function(thrownError){
				machine.scheduleNext("AJAX_ERROR_RESP", thrownError);
				return dispatch({
					type:"",
					data:null
				});
			});
};

export { login }
```

```js

/** hooks.js */

import { login } from './asyncActions.js'

const rerenderHookFactory = (component) => (state, error) => {
			component.setState(state);
};

const actionHandlerHookFactory = (storeorActionDispatcher) => (machine, action) => {
			switch(action.type){
				case "GET_USER":
					return storeorActionDispatcher.dispatch(login(machine, action));
				break;
			}
};

export { actionHandlerHookFactory, rerenderHookFactory }
```

```js

/** machine.js */

const statesGraph = {
      idle:{
        $BUTTON_CLICK:{
          next:function(stateGraph, actionData){
            return actionData.text.length > 0 
                ? 'searching' 
                : this.withError(null, new Error("No text entered in form..."));
          },
          action:function(actionData = null){
            return {type:"MAKE_ENTRY",data:actionData};
          },
          parallel:function(stateGraph, currentState){
            return "form.loading"
          }
        }
      },
      searching:{
        $AJAX_SUCCESS_RESP:{
          next:function(stateGraph, actionData){
             return 'idle';
          }
        },
        $AJAX_ERROR_RESP:{
          next:function(state, actionData){
              return actionData instanceof Error ?
               this.withError('idle', actionData) : this.withError(null, new Error("Invalid transition..."));
          },
          action:function(actionData = null){
            return null;
          }
        },
        $BUTTON_CLICK:{
            next:function(state, actionDataorError){
                return 'canceled';
            }
        }
      },
      canceled:{
          $BUTTON_CLICK:{
            next:function(state, actionDataorError){
            
            }
          }
      }
};

const machine = new HecterMachine(, {current:'idle',parallel:''})
```

```js

/** store.js */

import {createStore, applyMiddleware } from 'redux'
import machine from './machine.js'

const thunkMiddleware = () => {

}

const loggerMiddleware = () => {

}

const store = createStore(
function(state, action){
  switch(action.type){
    ...
  }
},
{todos:[]},
applyMiddleware(thunkMiddleware, loggerMiddleware)
);

store.subscribe(machine.nextAll.bind(machine));

export { store }

```

```js

  /** App.js */
  
  import React, { Component } from 'react'
  import { actionHandlerHookFactory, rerenderHookFactory } from './hooks.js'
  
  
```
