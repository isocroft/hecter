# hecter
A small library that utilizes the idea of state-charts to manage web app behavior enabling predictable &amp; responsive UIs by executing state transition graphs.

## APIs

> Getters / Triggers: 

let machine = new HecterMachine(transitionGraph, initialState);

- machine.get( void );
- machine.scheduleNext(eventName, actionData);
- machine.transit(eventName, actionData);
- machine.next( void );
- machine.nextAll( void );
- machine.disconnect( void );

> Hooks:

- machine.setRerenderHook( Function< state, hasError > );
- machine.setActionHandlerHook( Function< machine, action> );

## Usage

> **Hecter** can be used with any data flow management tool (e.g. Redux / MobX / Radixx )

- **asyncActions.js**

```js

/** asyncActions.js */

import axios from 'axios'

const networkRequest = (machine, action, params) => {
	
	let source = action.data.source;
	
	return (dispatch, getState) => {
	
		const storeDispatch = function(_action){
			setTimeout(() => {
				dispatch(_action);
			},0);
		};

		return axios(params).then(function(data){
			source = null;
			machine.scheduleNext("$AJAX_SUCCESS_RESP", null);
			return storeDispatch({
				type:action.type,
				data:data
			});
		}).catch(function(thrownError){
			source = null;
			machine.scheduleNext("$AJAX_ERROR_RESP", thrownError);
			return storeDispatch({
				type:"",
				data:null
			});
		});
	}
};

const delay = (machine, action, promise) => (dispatch, getState) => {

	//....
};

export { networkRequest, delay }
```

- **hooks.js**

```js

/** hooks.js */

import { networkRequest, delay } from './asyncActions.js'

const rerenderHookFactory = (component) => (state, hasError) => {
			component._hasError = hasError;
			return component.setState(state);
};

const actionHandlerHookFactory = (storeorActionDispatcher) => (machine, action) => {
			switch(action.type){
				case "MAKE_ENTRY":
					action = networkRequest(machine, action, {
						method:"GET",
						url:"https://jsonplaceholder.typicode.com/"+action.data.text,
						cancelToken:action.data.source.token
					});
				break;
			}
			
			return storeorActionDispatcher.dispatch(action);
};

export { actionHandlerHookFactory, rerenderHookFactory }
```

- **machine.js**

```js

/** machine.js */

const stateGraph = {
      idle:{
        $SEARCH_BUTTON_CLICK:{
          guard:function(stateGraph, currentState, actionData){
            return actionData.text.length > 0 
                ? 'searching' 
                : {current:null, error:new Error("No text entered in form...")};
          },
          action:function(actionData = null){
            return {type:"MAKE_ENTRY",data:actionData};
          },
          parallel:function(stateGraph, currentState){
            return "form.ready"
          }
        }
      },
      searching:{
        $AJAX_SUCCESS_RESP:{
          guard:function(stateGraph, actionData){
             return 'idle';
          },
	  action:null
        },
        $AJAX_ERROR_RESP:{
          guard:function(stateGraph, currentState, actionData){
              return actionData instanceof Error 
	      ? {current:'idle', error:actionData} 
	      : {current:null, error:new Error("Invalid transition...")};
          },
          action:null,
	  parallel:function(stateGraph, currentState){
	  	return "form.loading";
	  }
        },
        $CANCEL_BUTTON_CLICK:{
            guard:function(state, actionData){
                return 'canceled';
            },
	    action:null
        }
      },
      canceled:{
          $BUTTON_CLICK:{
            guard:function(state, actionData){
		return 'searching'
            },
	    action:null
          }
      }
};

const machine = new HecterMachine(stateGraph, {current:'idle',parallel:'form.ready',error:null});

export default machine
```

- **store.js**

```js

/** store.js */

import {createStore, applyMiddleware } from 'redux'
import machine from './machine.js'

const thunkMiddleware = ({ dispatch, getState }) => next => action => {
	
    if (typeof action === 'function') {
      	return action(dispatch, getState);
    }

    return next(action);
};

const loggerMiddleware = ({ getState }) => next => action => {
	
	console.log("PREV APP DATA STATE: ", getState());
	next(action);
	console.log("NEXT APP DATA STATE: ", getState());
	
};

const store = createStore(
function(state, action){
  switch(action.type){
    	case "MAKE_ENTRY":
		return Object.assign({}, state, {
			items:action.data
		});
	break;
	default:
		return state
  }
},
{items:[]},
applyMiddleware(thunkMiddleware, loggerMiddleware)
);

store.subscribe(machine.nextAll.bind(machine));

export default store

```
- **FormUnitComponent.js**

```js

/** FormUnitComponent.js */

import machine from './machine.js'
import axios from 'axios'

const source = null

const searchButtonClick = event => {

	const CancelToken = axios.CancelToken;
	const source = CancelToken.source();
	source = source
	
	machine.transit('$SEARCH_BUTTON_CLICK', {text:event.target.form.elements['query'].value, source});
}

const cancelButtonClick = event => {

	if(source !== null)
		source.cancel();

	machine.transit('$CANCEL_BUTTON_CLICK', null);
}

const renderInput = (data, behavior) => (
	behavior.parallel == "form.loading"
	? <input type="text" name="query" value={p.text} readonly="readonly">
	: <input type="text" name="query" value={p.text}>
)

const renderSearchButton = (data, behavior) => (
	behavior.parallel == "form.loading"
	? <button type="button" name="search" onClick={searchButtonClick} disabled="disabled">Searching...</button> 
	: <button type="button" name="search" onClick={searchButtonClick}>Search</button>
)

const renderCancelButton = (data, behavior) => (
	behavior.current === 'idle'
	? <button type="button" name="cancel" onClick={cancelButtonClick} disabled="disabled">Cancel</button> 
	: (behavior.current === 'canceled' 
			? <button type="button" name="cancel" onClick={cancelButtonClick}>Canceling...</button>
			: <button type="button" name="cancel" onClick={cancelButtonClick}>Cancel</button>)
)

const renderList = (data, behavior) => (
	data.length 
	? <ul>
		data.map(item => 
			<li>item</li>
		);
	  </ul>
	: <p>No search data yet!</p>
)

const renderLoadingMessage = (data, behavior) => {
	let message = `Loading Search Results...`;
	    
    	return (
		<p>
			<span>{message}</span>
		</p>
	);
}

const renderErrorMessage = (data, behavior) => {
	let message = `Error Loading Search Results: ${behavior.error}`;
	    
    	return (
		<p>
			<span>{message}</span>
		</p>
	);
}

const renderResult = (data, behavior) => (
		behavior.parallel === 'form.loading' 
		    ? renderLoadingMessage(data, behavior)
		    : behavior.error !== null ? renderErrorMessage(data, behavior) : renderList(data, behavior)
)



const FormUnit = props => 
	<div>
      		<form name="search" onSubmit={ (e) => e.preventDefault() }>
		  	{renderInput(null, props.behavior)}
	    	  	{renderSearchButton(null, props.behavior)}
	    		{renderCancelButton(null, props.behavior)}
              	</form>
	    	{renderResult(props.items, props.behavior)}
          </div>
	  
 export default FormUnit

```

- **App.js**

```js

  /** App.js */
  
  import React, { Component } from 'react'
  import { actionHandlerHookFactory, rerenderHookFactory } from './hooks.js'
  import FormUnit from './FormUnitComponent.js'
  
  class App extends Component {
  	
	constructor(props){

		this.state = props.machine.get();

		props.machine.setRerenderHook(rerenderHookFactory(this));
		props.machine.setActionHandlerHook(actionHandlerHookFactory(
			props.store
		));
	}

     	componentDidMount(){
	
	}
	
	render(){
		let data = this.props.store.getState();
		
		<FormUnit items={data.items} behavior={this.state} />
	}
  }
  
  export default App
  
```

- **main.js**

```js

/** main.js */

import ReactDOM from 'react-dom'
import App from './App.js'
import store from './store.js'
import machine from './machine.js'

ReactDOM.render(<App store={store} machine={machine} />, document.getElementById("root"))

```
