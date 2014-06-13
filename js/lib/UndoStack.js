var UndoStack = function() 
{
    this.reset();
};

(function() 
{
    this.actions = {};
    this.undoStack = [];
    this.redoStack = [];
    this.currentState;
    var self = this;

    /*
        Add a new function or overwrites the existing function for a specific identifier.

        @param title Unique identifier for a specific type of undo action that could be saved.
        @param onUndo Callback function when one of said type is undone.
        @param onRedo (optional) Callback function when one of said type is redone. If this is not passed as a parameter, both undo and redo will have the same callback function.
    */

    this.newAction = function(title, onUndo, onRedo)
    {
        if(onRedo !== undefined)
        {
            self.actions[title] = 
            {
                'undo': onUndo,
                'redo': onRedo,
            }
        }
        else 
        {
            self.actions[title] = 
            {
                'undo': onUndo,
                'redo': onUndo,
            }
        }
    }

    /*
        Saves a new instance to the undo stack and resets the redo stack.

        @param title Title of the action added with newAction to call when this is undone
        @param parameters Array of parameters to pass to said function
    */
    this.save = function(title, parameters) 
    {
        //if currentState exists (which it should after the first one), push
        if(self.currentState != undefined)
        {
            self.undoStack.push(self.currentState);
        }

        var completedObject = 
        {
            'title': title,
            'parameters': parameters
        }
        self.currentState = completedObject;
        self.redoStack = [];
    };

    /*
        Undoes the most recent action on the undo stack, pushes current state into the redo stack.

        Returns false if there is nothing available to undo, true if an undo was completed.
    */
    this.undo = function() 
    {
        if(!self.hasUndo())
        {
            return false;
        }

        var poppedObject = self.undoStack.pop();
        poppedObject.parameters.push(self.currentState);
        self.actions[poppedObject.title].undo.apply(this, poppedObject.parameters);

        self.redoStack.push(self.currentState);
        self.currentState = poppedObject;
        return true;
    };

    /*
        Redoes the most recent action on the redo stack, pushes current state into the undo stack.

        Returns false if there is nothing available to redo, true if a redo was completed.
    */
    this.redo = function() 
    {
        if(!self.hasRedo())
        {
            return false;
        }

        var poppedObject = self.redoStack.pop();
        poppedObject.parameters.push(self.currentState);
        self.actions[poppedObject.title].redo.apply(this, poppedObject.parameters);

        self.undoStack.push(self.currentState);
        self.currentState = poppedObject;
        return true;
    };


    this.reset = function() 
    {
        self.undoStack = [];
        self.redoStack = [];
    };
    this.hasUndo = function() 
    {
        return self.undoStack.length > 0;
    };
    this.hasRedo = function() 
    {
        return self.redoStack.length > 0;
    };

}).call(UndoStack.prototype);
