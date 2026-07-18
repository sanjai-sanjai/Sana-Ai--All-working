import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Sparkles, ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Assignment {
  id: string;
  title: string;
  assigned_to: string;
  estimated_time: string;
  difficulty: string;
  reason: string;
}

interface ReassignTopicsModalProps {
  assignments: Assignment[];
  members: any[];
  onSave: (assignments: Assignment[]) => void;
  onCancel: () => void;
}

export function ReassignTopicsModal({ assignments: initialAssignments, members, onSave, onCancel }: ReassignTopicsModalProps) {
  // Setup members state
  const memberOptions = members.map(m => ({
    id: m.id || m.user_id,
    name: m.name || m.profiles?.display_name || m.profiles?.username || "Unknown",
    avatar: m.profiles?.avatar_url,
  }));

  // Initial state setup for DnD
  const [items, setItems] = useState<Assignment[]>([]);

  useEffect(() => {
    // Generate unique IDs for DnD if not present, but use original if possible
    const withIds = initialAssignments.map((a, i) => ({
      ...a,
      id: a.id || `topic-${i}`
    }));
    setItems(withIds);
  }, [initialAssignments]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newItems = Array.from(items);
    const draggedItemIndex = newItems.findIndex(i => i.id === draggableId);
    
    if (draggedItemIndex > -1) {
      const draggedItem = newItems[draggedItemIndex];
      // If dropping into a member's droppable area
      if (destination.droppableId !== 'all-topics') {
        draggedItem.assigned_to = destination.droppableId; // droppableId is the member's name
      }
      setItems(newItems);
    }
  };

  const handleAutoBalance = () => {
    // Basic auto-balance heuristic (round-robin)
    // A better implementation would use actual profiling weights
    const newItems = [...items];
    newItems.forEach((item, idx) => {
      item.assigned_to = memberOptions[idx % memberOptions.length].name;
    });
    setItems(newItems);
  };

  const calculateTotalTime = (memberAssignments: Assignment[]) => {
    let totalMins = 0;
    memberAssignments.forEach(a => {
      const matchH = a.estimated_time.match(/(\d+)\s*(h|hr|hrs|hour|hours)/i);
      const matchM = a.estimated_time.match(/(\d+)\s*(m|min|mins|minute|minutes)/i);
      if (matchH) totalMins += parseInt(matchH[1]) * 60;
      if (matchM) totalMins += parseInt(matchM[1]);
    });
    
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  const allTopicsDroppableId = 'all-topics';

  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-gray-900/40 md:backdrop-blur-sm flex items-center justify-center overflow-hidden">
      <div className="w-full h-full md:h-[90vh] md:max-w-[750px] bg-white md:rounded-[32px] md:shadow-2xl flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">Reassign Topics</h2>
              <p className="text-[13px] font-medium text-gray-500">Drag and drop to exchange</p>
            </div>
          </div>
          <button 
            onClick={() => setItems(initialAssignments.map((a, i) => ({ ...a, id: a.id || `topic-${i}` })))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-[13px] font-bold hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* DnD Context */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Column: Topics */}
              <div className="w-[45%] border-r border-gray-100 bg-gray-50/50 p-6 overflow-y-auto">
                <h3 className="text-[15px] font-bold text-gray-900 mb-4">Topics</h3>
                <Droppable droppableId={allTopicsDroppableId} isDropDisabled={false}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 pb-20 min-h-full">
                      {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-white p-3.5 rounded-[16px] shadow-sm border border-gray-100 flex items-center justify-between gap-3 group transition-shadow",
                                snapshot.isDragging && "shadow-xl ring-2 ring-indigo-500/20 rotate-1 z-50 cursor-grabbing"
                              )}
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                  item.difficulty?.toLowerCase() === 'hard' ? "bg-red-50 text-red-600" :
                                  item.difficulty?.toLowerCase() === 'easy' ? "bg-green-50 text-green-600" :
                                  "bg-[#f3f0ff] text-[#6366f1]"
                                )}>
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <span className="text-[13.5px] font-bold text-gray-800 truncate">{item.title}</span>
                              </div>
                              <span className="text-[11.5px] font-bold text-gray-400 shrink-0">{item.estimated_time}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Right Column: Team Members */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-[15px] font-bold text-gray-900">Team Members</h3>
                  <p className="text-[12.5px] font-medium text-gray-500">Drag topics to members</p>
                </div>
                
                <div className="space-y-6 pb-24">
                  {memberOptions.map((member) => {
                    const memberAssignments = items.filter(a => 
                      a.assigned_to?.trim().toLowerCase() === member.name?.trim().toLowerCase()
                    );
                    const totalTime = calculateTotalTime(memberAssignments);

                    return (
                      <div key={member.name} className="border border-gray-100 rounded-[24px] p-4 bg-gray-50/30">
                        <div className="flex items-center gap-3 mb-4">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-bold text-[16px] shadow-sm ring-2 ring-white">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-[14.5px] font-bold text-gray-900 leading-tight">{member.name}</h4>
                            <p className="text-[12px] font-semibold text-gray-500 mt-0.5">
                              {memberAssignments.length} Topics • {totalTime}
                            </p>
                          </div>
                        </div>

                        <Droppable droppableId={member.name}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.droppableProps}
                              className={cn(
                                "min-h-[80px] rounded-2xl p-2 transition-colors",
                                snapshot.isDraggingOver ? "bg-indigo-50/50 border border-indigo-200 border-dashed" : "bg-transparent"
                              )}
                            >
                              <div className="space-y-2">
                                {memberAssignments.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                          "bg-white px-4 py-3 rounded-[14px] shadow-sm border border-gray-100 flex items-center justify-between gap-3 group transition-shadow",
                                          snapshot.isDragging && "shadow-xl ring-2 ring-indigo-500/20 rotate-1 z-50 cursor-grabbing"
                                        )}
                                      >
                                        <span className={cn(
                                          "text-[13px] font-bold truncate",
                                          item.difficulty?.toLowerCase() === 'hard' ? "text-red-700" :
                                          item.difficulty?.toLowerCase() === 'easy' ? "text-green-700" :
                                          "text-[#6366f1]"
                                        )}>{item.title}</span>
                                        <MoreVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DragDropContext>
          
          {/* Footer Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <button 
              onClick={handleAutoBalance}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[14.5px] font-bold text-[#6366f1] bg-white border border-[#e2e8f0]/80 shadow-sm hover:bg-gray-50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Auto Balance
            </button>
            <button 
              onClick={() => onSave(items)}
              className="px-10 py-3 rounded-2xl text-[14.5px] font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
