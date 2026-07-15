import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { TopBar } from "@/components/app/TopBar";
import { Users, Plus, BookOpen, GraduationCap, Target, FileText, Search, ChevronDown, X } from "lucide-react";
import { GradientButton } from "@/components/app/GradientButton";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchProfiles, Profile } from "@/hooks/use-profiles";
import { useCreateGroupMutation } from "@/hooks/use-study-groups";
import { LearningProfileEditor, LearningProfile } from "@/components/study-together/LearningProfileEditor";

export const Route = createFileRoute("/_authenticated/study-together/create")({
  component: CreateStudyGroupScreen,
});

function InputField({ label, icon: Icon, placeholder, value, onChange, isTextarea = false }: any) {
  return (
    <div className="mx-4 mt-5">
      <label className="mb-2 block text-[13px] font-bold text-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
        {isTextarea ? (
          <textarea
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="min-h-[100px] w-full resize-none rounded-2xl border border-border bg-card p-4 pl-11 text-[14.5px] font-medium shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="h-14 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-[14.5px] font-medium shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
      </div>
    </div>
  );
}

function SelectField({ label, icon: Icon, value, onChange, options }: any) {
  return (
    <div className="mx-4 mt-5">
      <label className="mb-2 block text-[13px] font-bold text-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <select 
          value={value}
          onChange={onChange}
          className="h-14 w-full appearance-none rounded-2xl border border-border bg-card pl-11 pr-11 text-[14.5px] font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function CreateStudyGroupScreen() {
  const nav = useNavigate();
  const { user } = useAuth();
  
  // Steps: 'details' -> 'onboarding'
  const [step, setStep] = useState<'details' | 'onboarding'>('details');

  // Form State
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Computer Science");
  const [semester, setSemester] = useState("Semester 1");
  const [description, setDescription] = useState("");
  
  // Member Search State
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults } = useSearchProfiles(searchQuery);
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  
  // Learning Profile State for Owner
  const [ownerProfile, setOwnerProfile] = useState<LearningProfile | null>(null);

  const createMutation = useCreateGroupMutation();

  const handleAddMember = (profile: Profile) => {
    if (profile.user_id === user?.id) return; // Can't add self
    if (selectedMembers.find(m => m.user_id === profile.user_id)) return;
    setSelectedMembers([...selectedMembers, profile]);
    setSearchQuery("");
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.user_id !== userId));
  };

  const handleNextStep = () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setStep('onboarding');
  };

  const handleCreateGroup = (profile: LearningProfile) => {
    if (!user) return;
    
    // The user running this is the owner
    const membersPayload = [
      {
        user_id: user.id,
        role: "owner" as const,
        status: "active" as const,
        strengths: profile.strengths,
        learning_preferences: profile.learning_styles, // we use styles from profile
      },
      // Invited members
      ...selectedMembers.map(m => ({
        user_id: m.user_id,
        role: "member" as const,
        status: "invited" as const,
      }))
    ];

    createMutation.mutate({
      name,
      subject,
      semester,
      description,
      members: membersPayload
    }, {
      onSuccess: (groupId) => {
        toast.success("Study Group created successfully!");
        nav({ to: "/study-together/$groupId", params: { groupId } });
      },
      onError: (err) => {
        toast.error("Failed to create group: " + err.message);
      }
    });
  };

  if (step === 'onboarding') {
    return (
      <div className="min-h-svh bg-background pb-8 pt-10">
        <TopBar
          title="Team Setup"
          subtitle="Configure your learning profile"
          back={() => setStep('details')}
          hideDefaults
        />
        <div className="mt-8">
          <LearningProfileEditor 
            onSave={handleCreateGroup} 
            onCancel={() => setStep('details')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background pb-20">
      <TopBar
        title="Create Study Group"
        subtitle="Start a new learning journey together"
        back="/study-together"
        hideDefaults
      />

      <div className="mx-auto mt-6 flex justify-center">
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-primary/10 shadow-inner">
          <Users className="h-10 w-10 text-primary" />
          <div className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-[3px] border-background bg-card shadow-sm cursor-pointer hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <InputField 
        label="Group Name" 
        icon={Users} 
        placeholder="e.g. Data Structures Team" 
        value={name} 
        onChange={(e: any) => setName(e.target.value)} 
      />
      <SelectField 
        label="Subject / Course" 
        icon={BookOpen} 
        value={subject} 
        onChange={(e: any) => setSubject(e.target.value)} 
        options={["Computer Science", "Data Structures", "Operating Systems", "Mathematics", "Physics", "Other"]}
      />
      <SelectField 
        label="Semester / Class" 
        icon={GraduationCap} 
        value={semester} 
        onChange={(e: any) => setSemester(e.target.value)} 
        options={["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]}
      />
      <InputField
        label="Description (Optional)"
        icon={FileText}
        placeholder="What is the goal of this study group?"
        value={description}
        onChange={(e: any) => setDescription(e.target.value)}
        isTextarea
      />

      <div className="mx-4 mt-5 relative">
        <label className="mb-2 block text-[13px] font-bold text-foreground">Invite Members</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="h-14 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-[14.5px] font-medium shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim().length > 0 && searchResults && (
          <div className="absolute z-10 w-full mt-2 rounded-2xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No users found.</div>
            ) : (
              searchResults.map(profile => (
                <div 
                  key={profile.user_id}
                  onClick={() => handleAddMember(profile)}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                >
                  <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt={profile.username} className="h-10 w-10 rounded-full object-cover bg-muted" />
                  <div>
                    <p className="text-[14px] font-bold text-foreground leading-tight">{profile.display_name}</p>
                    <p className="text-[12px] text-muted-foreground">@{profile.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedMembers.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 shadow-sm"
            >
              <img
                src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`}
                alt={m.username}
                className="h-6 w-6 rounded-full object-cover bg-muted"
              />
              <span className="text-[12px] font-medium text-foreground">@{m.username}</span>
              <X 
                onClick={() => handleRemoveMember(m.user_id)}
                className="ml-1 h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-foreground" 
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 px-4">
        <GradientButton
          onClick={handleNextStep}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Creating..." : "Next Step"}
        </GradientButton>
      </div>
    </div>
  );
}
