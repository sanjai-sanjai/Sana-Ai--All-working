import { useState } from "react";
import { Check, Brain, Lightbulb, TrendingDown, Target, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LearningProfile {
  strengths: string[];
  weaknesses: string[];
  learning_styles: string[];
}

interface LearningProfileEditorProps {
  initialProfile?: LearningProfile;
  onSave: (profile: LearningProfile) => void;
  onCancel?: () => void;
}

const AREA_OPTIONS = [
  "Programming", "Theory", "Problem Solving", "Diagrams", 
  "Teaching", "Visualization", "Research", "Coding", 
  "Memory", "Communication"
];

const STYLE_OPTIONS = [
  "Fast Reading", "Visual", "Practice", "Examples", 
  "Video", "MCQ", "Discussion"
];

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

export function LearningProfileEditor({ initialProfile, onSave, onCancel }: LearningProfileEditorProps) {
  const [strengths, setStrengths] = useState<string[]>(initialProfile?.strengths || []);
  const [weaknesses, setWeaknesses] = useState<string[]>(initialProfile?.weaknesses || []);
  const [styles, setStyles] = useState<string[]>(initialProfile?.learning_styles || []);

  const handleSave = () => {
    onSave({
      strengths,
      weaknesses,
      learning_styles: styles,
    });
  };

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
            selected={strengths} 
            onChange={setStrengths}
            icon={Target}
            colorClass="bg-green-500"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-[15px] font-bold text-foreground">Preferred Learning Style</h3>
          </div>
          <MultiSelect 
            options={STYLE_OPTIONS} 
            selected={styles} 
            onChange={setStyles}
            icon={FileText}
            colorClass="bg-primary"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h3 className="text-[15px] font-bold text-foreground">Weak Areas (To Improve)</h3>
          </div>
          <MultiSelect 
            options={AREA_OPTIONS} 
            selected={weaknesses} 
            onChange={setWeaknesses}
            colorClass="bg-red-500"
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
