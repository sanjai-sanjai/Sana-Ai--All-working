import { 
  Brain, Target, Activity, AlertTriangle, 
  ArrowRightLeft, Sparkles, Calendar, Zap, RefreshCw, BarChart, 
  HeartPulse, Scale, CheckCircle2 
} from "lucide-react";
import { ProgressRing } from "@/components/app/ProgressRing";
import { format } from "date-fns";
import { useState } from "react";

export interface AnalyticsData {
  overviewMessage?: string;
  teamHealth?: "Excellent" | "Good" | "Needs Attention" | "Critical";
  teamReadiness?: number;
  examReadiness?: {
    confidenceScore: number;
    estimatedCompletionDate: string;
    highRiskTopics: string[];
  };
  memberHealth?: Array<{
    name: string;
    status: "Healthy" | "Needs Revision" | "Inactive" | "Falling Behind" | "Busy" | "Vacation Mode";
    reason: string;
  }>;
  weakMembers?: Array<{
    name: string;
    currentProgress: number;
    expectedProgress: number;
    recommendation: string;
  }>;
  redistributions?: Array<{
    topicId?: string;
    topicTitle: string;
    fromMemberId?: string;
    fromMember: string;
    toMemberId?: string;
    toMember: string;
    reason: string;
  }>;
  loadBalancer?: Array<{
    warning: string;
    suggestion: string;
  }>;
  dailyPlan?: Array<{
    memberName: string;
    task: string;
  }>;
  smartReminders?: Array<{
    title: string;
    message: string;
  }>;
  insights?: string[];
  revisionTargets?: string[];
  smartMotivation?: string;
}

interface AiCoachDashboardProps {
  analytics: AnalyticsData | null;
  timeline: any[];
  onRefreshAnalytics: () => void;
  onApproveRedistribution?: (swap: any) => Promise<void>;
  isRefreshing: boolean;
}

export function AiCoachDashboard({ analytics, timeline, onRefreshAnalytics, onApproveRedistribution, isRefreshing }: AiCoachDashboardProps) {
  const [approvingTopic, setApprovingTopic] = useState<string | null>(null);

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#f8f9fe]">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#6366f1]/10 text-[#6366f1] mb-6">
          <Brain className="h-10 w-10 animate-pulse" />
        </div>
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">AI Coach is analyzing...</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-[280px]">
          Sana is reviewing the team's progress and syllabus to generate your first strategy report.
        </p>
        <button 
          onClick={onRefreshAnalytics}
          disabled={isRefreshing}
          className="mt-6 flex items-center gap-2 rounded-full bg-[#6366f1] text-white px-6 py-3 font-bold shadow-sm disabled:opacity-50 transition-all hover:bg-[#5558e6]"
        >
          {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          {isRefreshing ? "Generating..." : "Generate Now"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f8f9fe] p-6 pb-32 overflow-y-auto space-y-6">
      
      {/* Header Overview Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] p-7 text-white shadow-[0_8px_30px_rgb(67,56,202,0.25)]">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-indigo-300" />
              <h2 className="text-[14px] font-bold tracking-wider text-indigo-200 uppercase">AI Coach Overview</h2>
            </div>
            <p className="text-[18px] font-medium leading-relaxed max-w-[80%]">
              {analytics.overviewMessage}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-[13px] font-bold text-indigo-50">{analytics.smartMotivation}</span>
            </div>
            
            {/* Team Health Badge */}
            {analytics.teamHealth && (
              <div className="mt-4 flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-400" />
                <span className="text-[13px] font-bold text-white/90">Team Health: <span className={
                  analytics.teamHealth === "Excellent" ? "text-emerald-400" :
                  analytics.teamHealth === "Good" ? "text-blue-400" :
                  analytics.teamHealth === "Needs Attention" ? "text-yellow-400" : "text-rose-400"
                }>{analytics.teamHealth}</span></span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing value={analytics.teamReadiness || 0} size={76} stroke={6} className="text-white" label={`${analytics.teamReadiness}%`} />
            <span className="text-[11px] font-bold text-indigo-300 mt-2 uppercase tracking-widest">Readiness</span>
          </div>
        </div>
      </div>

      {/* Exam Readiness Section */}
      {analytics.examReadiness && (
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              Exam Readiness Prediction
            </h3>
            <p className="text-[14px] text-gray-500 mt-1">
              Estimated Completion: <span className="font-bold text-gray-700">{analytics.examReadiness.estimatedCompletionDate}</span>
            </p>
            {analytics.examReadiness.highRiskTopics.length > 0 && (
              <p className="text-[13px] text-rose-500 font-medium mt-1">High Risk: {analytics.examReadiness.highRiskTopics.join(", ")}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[28px] font-black text-indigo-600">{analytics.examReadiness.confidenceScore}%</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Confidence</p>
          </div>
        </div>
      )}

      {/* Grid Layout for Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Daily Plan & Member Health */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#6366f1]" />
              Today's Mission
            </h3>
          </div>
          <div className="space-y-5">
            {analytics.dailyPlan?.map((plan, idx) => {
              const health = analytics.memberHealth?.find(m => m.name === plan.memberName);
              return (
                <div key={idx} className="flex gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600 font-bold text-[13px]">
                    {plan.memberName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-bold text-gray-900">{plan.memberName}</p>
                      {health && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          health.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                          health.status === 'Inactive' || health.status === 'Falling Behind' ? 'bg-rose-100 text-rose-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {health.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-600 mt-1 leading-snug">{plan.task}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#10b981]" />
              Study Insights
            </h3>
          </div>
          <ul className="space-y-3">
            {analytics.insights?.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-[#10b981] shrink-0" />
                <p className="text-[14px] text-gray-700 leading-snug">{insight}</p>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Interventions & Load Balancer Section */}
      {(analytics.weakMembers && analytics.weakMembers.length > 0) || 
       (analytics.redistributions && analytics.redistributions.length > 0) ||
       (analytics.loadBalancer && analytics.loadBalancer.length > 0) ? (
        <div className="rounded-[24px] border border-orange-100 bg-orange-50/30 p-6">
          <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Orchestrator Interventions Required
          </h3>
          <div className="grid gap-4">
            
            {/* Load Balancer */}
            {analytics.loadBalancer?.map((load, idx) => (
              <div key={`load-${idx}`} className="flex items-center gap-3 bg-white p-4 rounded-[16px] border border-yellow-200 shadow-sm">
                <Scale className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-gray-900">{load.warning}</p>
                  <p className="text-[13px] text-gray-600 mt-1">{load.suggestion}</p>
                </div>
              </div>
            ))}

            {/* Weak Members */}
            {analytics.weakMembers?.map((weak, idx) => (
              <div key={`weak-${idx}`} className="flex items-center justify-between bg-white p-4 rounded-[16px] border border-orange-100 shadow-sm">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">{weak.name} is falling behind</p>
                  <p className="text-[13px] text-gray-500 mt-1">Expected {weak.expectedProgress}% but currently at {weak.currentProgress}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full inline-block">
                    {weak.recommendation}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Redistributions */}
            {analytics.redistributions?.map((swap, idx) => (
              <div key={`swap-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-[16px] border border-indigo-100 shadow-sm gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-gray-900">
                    <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                    Reassign: {swap.topicTitle}
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1">Move from <span className="font-semibold text-gray-700">{swap.fromMember}</span> to <span className="font-semibold text-gray-700">{swap.toMember}</span></p>
                </div>
                <button 
                  onClick={async () => {
                    if (onApproveRedistribution && swap.topicId) {
                      setApprovingTopic(swap.topicId);
                      await onApproveRedistribution(swap);
                      setApprovingTopic(null);
                    }
                  }}
                  disabled={!swap.topicId || approvingTopic === swap.topicId}
                  className="whitespace-nowrap flex justify-center items-center gap-2 text-[13px] font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {approvingTopic === swap.topicId ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve Swap
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Revision Recommendations */}
      {analytics.revisionTargets && analytics.revisionTargets.length > 0 && (
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-500" />
              Recommended Revisions
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.revisionTargets.map((topic, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-[13px] font-bold rounded-full">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Realtime Team Timeline */}
      <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-5">
          <BarChart className="h-5 w-5 text-blue-500" />
          Live Team Timeline
        </h3>
        <div className="space-y-4">
          {timeline && timeline.length > 0 ? (
            timeline.map((event, idx) => (
              <div key={event.id || idx} className="flex gap-4 relative">
                {idx !== timeline.length - 1 && (
                  <div className="absolute left-[11px] top-[24px] bottom-[-16px] w-[2px] bg-gray-100" />
                )}
                <div className="relative z-10 mt-1 h-6 w-6 rounded-full border-[3px] border-white bg-blue-500 shadow-sm shrink-0" />
                <div>
                  <p className="text-[14px] text-gray-900">
                    <span className="font-bold">{event.profiles?.display_name || 'Someone'}</span> {event.action}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {format(new Date(event.created_at), "h:mm a · MMM d")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-gray-500 text-center py-4">No recent activity detected.</p>
          )}
        </div>
      </div>

    </div>
  );
}
