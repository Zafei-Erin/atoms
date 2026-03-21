import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PlusIcon,
  Trash2Icon,
  MessageSquareIcon,
  PanelLeftIcon,
} from "lucide-react";
import {
  createProject,
  listProjects,
  deleteProject,
  type Project,
} from "@/api/projects";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    listProjects().then(setProjects).catch(console.error);
  }, [projectId]);

  // 当前项目还没有标题时，每 1.5 秒轮询一次，直到标题出现
  useEffect(() => {
    const currentProject = projects.find((p) => p.id === projectId);
    if (!currentProject || currentProject.title) return;

    const interval = setInterval(() => {
      listProjects().then(setProjects).catch(console.error);
    }, 1500);
    return () => clearInterval(interval);
  }, [projects, projectId]);

  const handleNew = async () => {
    const { id } = await createProject();
    navigate(`/chat/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (id === projectId) navigate("/");
  };

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="absolute top-3 left-3 z-10 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
        title={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeftIcon className="size-4" />
      </button>

      {/* Sidebar panel */}
      {isOpen && (
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-[#ebebeb] border-r border-gray-200 h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 mt-8">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </span>
            <button
              onClick={handleNew}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
              title="New project"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {projects.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-3">No projects yet</p>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/chat/${p.id}`)}
                className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  p.id === projectId
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                <MessageSquareIcon className="size-3.5 flex-shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-[13px]">
                  {p.title ?? "New Project"}
                </span>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2Icon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
