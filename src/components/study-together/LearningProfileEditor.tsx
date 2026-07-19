import { useState } from "react";
import { Check, Brain, Lightbulb, TrendingDown, Target, FileText, Clock, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LearningProfile {
  strongest_skills: string[];
  weak_skills: string[];
  learning_style: string[];
  confidence_levels: Record<string, string>;
  teaching_preference: string;
  availability: string[];
}

interface LearningProfileEditorProps {
  initialProfile?: Partial<LearningProfile>;
  onSave: (profile: LearningProfile) => void;
  onCancel?: () => void;
}

const AREA_OPTIONS = [
  "Programming", "Theory", "Problem Solving", "Diagrams", 
  "Teaching", "Visualization", "Research", "Coding", 
  "Memory", "Communication"
];

const STYLE_OPTIONS = [
  "Visual", "Practice", "Examples", "Video", "Reading", "Discussion", "MCQ", "Hands-on"
];

const AVAILABILITY_OPTIONS = [
  "Morning", "Afternoon", "Evening", "Night", "Weekend Only"
];

const CONFIDENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

function MultiSelect({ options, selected, onChange, icon: Icon, colorClass }: any) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((o: string) => o !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: string) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all border",
              isSelected 
                ? cn("border-transparent text-white shadow-sm", colorClass)
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {!isSelected && Icon && <Icon className="h-3.5 w-3.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SelectGroup({ label, options, selected, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: string) => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all border",
              isSelected 
                ? "border-transparent bg-primary text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function LearningProfileEditor({ initialProfile, onSave, onCancel }: LearningProfileEditorProps) {
  const [strongestSkills, setStrongestSkills] = useState<string[]>(initialProfile?.strongest_skills || []);
  const [weakSkills, setWeakSkills] = useState<string[]>(initialProfile?.weak_skills || []);
  const [learningStyle, setLearningStyle] = useState<string[]>(initialProfile?.learning_style || []);
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, string>>(initialProfile?.confidence_levels || {});
  const [teachingPreference, setTeachingPreference] = useState<string>(initialProfile?.teaching_preference || "Sometimes");
  const [availability, setAvailability] = useState<string[]>(initialProfile?.availability || []);

  const handleSave = () => {
    onSave({
      strongest_skills: strongestSkills,
      weak_skills: weakSkills,
      learning_style: learningStyle,
      confidence_levels: confidenceLevels,
      teaching_preference: teachingPreference,
      availability,
    });
  };

  const handleConfidenceChange = (skill: string, level: string) => {
    setConfidenceLevels(prev => ({ ...prev, [skill]: level }));
  };

  const selectedSkills = Array.from(new Set([...strongestSkills, ...weakSkills]));

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-[20px] font-bold tracking-tight text-foreground">Learning Profile Setup</h2>
        <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted-foreground">
          Teach Sana AI about your strengths and preferences so it can distribute topics effectively among the team.
        </p>
      </div>

      <div className="mx-4 space-y-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            <h3 className="text-[15px] font-bold text-foreground">Strongest Areas</h3>
          </div>
          <MultiSelect 
            options={AREA_OPTIONS} 
            selected={strongestSkills} 
            onChange={setStrongestSkills}
            icon={Target}
            colorClass="bg-green-500"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h3 className="text-[15px] font-bold text-foreground">Weak Areas (To Improve)</h3>
          </div>
          <MultiSelect 
            options={AREA_OPTIONS} 
            selected={weakSkills} 
            onChange={setWeakSkills}
            colorClass="bg-red-500"
          />
        </div>

        {selectedSkills.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-[14px] font-bold text-foreground mb-4">Confidence Levels</h3>
            <div className="space-y-4">
              {selectedSkills.map(skill => (
                <div key={skill} className="flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-muted-foreground">{skill}</span>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_LEVELS.map(level => {
                      const isSelected = confidenceLevels[skill] === level;
                      return (
                        <button
                          key={level}
                          onClick={() => handleConfidenceChange(skill, level)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-transparent shadow-soft"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-[15px] font-bold text-foreground">Preferred Learning Style</h3>
          </div>
          <MultiSelect 
            options={STYLE_OPTIONS} 
            selected={learningStyle} 
            onChange={setLearningStyle}
            icon={FileText}
            colorClass="bg-primary"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <h3 className="text-[15px] font-bold text-foreground">I enjoy teaching teammates</h3>
          </div>
          <SelectGroup 
            options={["Yes", "Sometimes", "No"]} 
            selected={teachingPreference} 
            onChange={setTeachingPreference} 
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-[15px] font-bold text-foreground">Time Availability</h3>
          </div>
          <MultiSelect 
            options={AVAILABILITY_OPTIONS} 
            selected={availability} 
            onChange={setAvailability}
            colorClass="bg-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3 px-4">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border bg-card py-4 text-[15px] font-bold text-foreground hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSave}
          className="flex-[2] rounded-2xl bg-primary py-4 text-[15px] font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
