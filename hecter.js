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
        return this.state
      }
      
      action(){
        return this.action
      }
      
      transit(eventName, actionData, ){
          let transitionSet = this.graph[this.state.current];
          
          if(! transitionSet){
              throw new Error("state not in set");
          }

          let newBehaviorState = transitionSet[eventName];
          
          let newState = newBehaviorState.next(this.graph, this.state.current, actionData);
          
          if(newState === null){
          
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
    
    setRerenderHook(){
        const state = this.get();
        const action = this.
    }
    
    setAactionHandlerHook

}

export default HecterMachine
