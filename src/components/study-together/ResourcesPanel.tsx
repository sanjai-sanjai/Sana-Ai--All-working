import { X, FileText, Image as ImageIcon, Link as LinkIcon, Download, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "docx" | "cpp" | "png" | "link" | "notes" | "flashcards";
  uploaderName: string;
  sizeBytes?: number;
  createdAt: string;
  summary?: string;
  preview?: any;
  likes?: number;
  bookmarks?: number;
  commentsCount?: number;
}

interface ResourcesPanelProps {
  resources: Resource[];
  onClose?: () => void;
}

export function ResourcesPanel({ resources, onClose }: ResourcesPanelProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const filters = ["All", "AI Notes", "PDF", "Code", "Images", "Links"];

  const getIcon = (type: string) => {
    switch (type) {
      case 'notes': 
      case 'flashcards': return <Sparkles className="h-6 w-6 text-purple-500 stroke-[2]" />;
      case 'pdf': return <FileText className="h-6 w-6 text-red-500 stroke-[2]" />;
      case 'docx': return <FileText className="h-6 w-6 text-blue-500 stroke-[2]" />;
      case 'cpp': return <FileText className="h-6 w-6 text-orange-500 stroke-[2]" />;
      case 'png': return <ImageIcon className="h-6 w-6 text-green-500 stroke-[2]" />;
      default: return <LinkIcon className="h-6 w-6 text-gray-500 stroke-[2]" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'notes':
      case 'flashcards': return "bg-purple-50 border-purple-100";
      case 'pdf': return "bg-red-50 border-red-100";
      case 'docx': return "bg-blue-50 border-blue-100";
      case 'cpp': return "bg-orange-50 border-orange-100";
      case 'png': return "bg-green-50 border-green-100";
      default: return "bg-gray-50 border-gray-100";
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f8f9fe] p-6 pb-32 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Team Knowledge Hub</h2>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">Shared notes, resources, and insights</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <X className="h-5 w-5 stroke-[2]" />
          </button>
        )}
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 stroke-[2]" />
        <input
          type="text"
          placeholder="Search resources..."
          className="h-14 w-full rounded-[20px] border border-gray-200 bg-white pl-13 pr-5 text-[15px] font-medium shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition-all"
        />
      </div>

      <div className="hide-scrollbar mb-8 flex gap-2.5 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "whitespace-nowrap rounded-[16px] px-5 py-2.5 text-[14px] font-bold transition-all",
              activeFilter === filter
                ? "bg-[#6366f1] text-white shadow-[0_4px_12px_rgb(99,102,241,0.3)]"
                : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {resources.map((resource) => (
          <div key={resource.id} className="flex flex-col rounded-[24px] border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === resource.id ? null : resource.id)}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-[16px] border", getIconBg(resource.type))}>
                  {getIcon(resource.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-[16px] font-bold text-gray-900 tracking-tight group-hover:text-[#6366f1] transition-colors">
                    {resource.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-gray-500">
                    <span>{resource.uploaderName}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <span>{resource.sizeBytes ? (resource.sizeBytes / 1024).toFixed(1) + ' KB' : resource.type.toUpperCase()}</span>
                    {resource.commentsCount !== undefined && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span>{resource.commentsCount} comments</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 pl-3">
                <span className="text-[12px] font-semibold text-gray-400">
                  {format(new Date(resource.createdAt), "MMM d")}
                </span>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-[#6366f1] hover:text-white">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Inline Preview / Summary */}
            {expandedId === resource.id && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-5 px-6 animate-in fade-in slide-in-from-top-2">
                <h5 className="text-[14px] font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#6366f1]" />
                  AI Summary
                </h5>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {resource.summary || "No summary available for this resource yet. Ask Sana AI to summarize it in the chat!"}
                </p>
                <div className="mt-4 flex gap-3">
                  <button className="text-[13px] font-bold text-[#6366f1] hover:underline">
                    Read Full Document
                  </button>
                  <button className="text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    View {resource.commentsCount || 0} Comments
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {resources.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gray-100 text-gray-400 mb-5">
              <FileText className="h-10 w-10 stroke-[1.5]" />
            </div>
            <p className="text-[18px] font-bold text-gray-900">No resources found</p>
            <p className="text-[15px] font-medium text-gray-500 mt-1.5">Files shared in chat will appear here.</p>
          </div>
        )}
      </div>
      
      <button className="mt-8 flex w-full items-center justify-between rounded-[20px] bg-white border border-gray-200 px-5 py-4 text-[15px] font-bold text-gray-900 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md">
        View All Resources
        <span className="text-[18px] text-gray-400">→</span>
      </button>
    </div>
  );
}
