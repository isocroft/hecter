/**!

@version: 0.1.0
@created: 16th Nov, 2018

*/


class Statemachine {

      constructor(graph, init){
          this.graph = graph;
          this.state = init || {current:null,parallel:null};
          this.action = null;
          this.handlers = {};
      }
      
      get(){
        return this.state;
      }
      
      disconnect(){
        return (this.handlers = {}) !== null;
      }
      
      transit(eventName, actionData){
          let transitionSet = this.graph[this.state.current];
          
          if(! transitionSet){
              return this.emit("rerenderHook", this.state, new Error("state not in set"));
          }

          let newBehaviorState = transitionSet[eventName];
          
          let currentState = newBehaviorState.next(this.graph, this.state.current, actionData);
          let parallelState = newBehaviorState.parallel(this.graph, this.state.current);
          
          if(currentState instanceof Object){
                  currentState.parallel = parallelState;
          }else if(typeof currentState === 'string'){
                  currentState = {
                        current:currentState,
                        parallel:parallelState
                  }
          }
            
          this.state = currentState;
          let action = actionData === null ? null : newBehaviorState.action(actionData);
          
          this.emit("rerenderHook", this.state, (this.state.error !== null));
          
            if(action !== null){
                  return this.emit("actionHandlerHook", this, action);
            }
      }
      
      on(handlerKey, handler){
          if(typeof handlerKey == 'string'
              && typeof handler == 'function'){
              this.handlers[handlerKey] = handler;
          }
      }
      
      emit(handlerKey, ...emitData){
          let handler = this.handlers[handlerKey];
          
          if(typeof handler == 'function'){
              return handler(emitData);
          }
      }

}


class HecterMachine extends StateMachine {

    constructor(graph, init){
        super(graph, init);
       this.stateTransitionScheduleQueue = [

       ];
    }
    
    scheduleNext(eventName, actionData){
        if(this.stateTransitionScheduleQueue){
            this.stateTransitionScheduleQueue.push({eventName, actionData});
        }
    }
    
    next(){
        if(this.stateTransitionScheduleQueue.length){
            const {eventName, actionData} = this.stateTransitionScheduleQueue.shift();
            return this.transit(eventName, actionData);
        }
    }
    
    setRerenderHook(callback){
        return this.on("rerenderHook", callback);
    }
    
    setActionHandlerHook(callback){
        return this.on("actionHandlerHook", callback);
    }

}

export default HecterMachine
