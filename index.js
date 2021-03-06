/**!

@version: 0.1.0
@created: 16th Nov, 2018

*/


class StateMachine {

      constructor(graph, init){
          this.graph = graph;
          this.state = init || {current:null,parallel:null};
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
               this.state.error = new Error("state not in set");
               this.emit("rerenderHook", this.state, (this.state.error !== null));
               return null;
          }

          let newBehaviorState = transitionSet[eventName];
          
          let currentState = newBehaviorState.guard(this.graph, this.state.current, actionData);
          let parallelState = newBehaviorState.parallel(this.graph, this.state.current);
          
          if(currentState instanceof Object){
                  currentState.parallel = parallelState;
          }else if(typeof currentState === 'string'){
                  currentState = {
                        current:currentState,
                        parallel:parallelState,
                        error:null
                  }
          }
            
          this.state = currentState;
          let action = actionData === null || actionData instanceof Error
                        ? null : newBehaviorState.action(actionData);
          
          this.emit("rerenderHook", this.state, (this.state.error !== null));
          
          if(action !== null)
                  return this.emit("actionHandlerHook", this, action);
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
              return handler(...emitData);
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
      
    nextAll(){
            while(this.stateTransitionScheduleQueue.length != 0){
                  this.next();
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
