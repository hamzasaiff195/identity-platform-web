"use client";

import { createPortal } from "react-dom";
import {
  Eye,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { User, UserStatus } from "@/lib/users-api";

type UserActionsProps = {
  user: User;

  onView: (user: User) => void;

  onEdit: (user: User) => void;

  onStatusChange: (user: User, status: UserStatus) => void;

  onRevokeSessions: (user: User) => void;

  onDelete: (user: User) => void;

  onRestore: (user: User) => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 224;
const MENU_GAP = 6;
const VIEWPORT_PADDING = 8;

export function UserActions({
  user,
  onView,
  onEdit,
  onStatusChange,
  onRevokeSessions,
  onDelete,
  onRestore,
}: UserActionsProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  function updateMenuPosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();

    const menuElement = menuRef.current;

    const menuHeight = menuElement?.offsetHeight ?? 360;

    let left = rect.right - MENU_WIDTH;
    let top = rect.bottom + MENU_GAP;

    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    if (left + MENU_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (
      spaceBelow < menuHeight + MENU_GAP &&
      spaceAbove >= menuHeight + MENU_GAP
    ) {
      top = rect.top - menuHeight - MENU_GAP;
    }

    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    }

    if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = window.innerHeight - menuHeight - VIEWPORT_PADDING;
    }

    setMenuPosition({
      top,
      left,
    });
  }

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);

    requestAnimationFrame(() => {
      updateMenuPosition();
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      updateMenuPosition();
    });

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target)) {
        return;
      }

      if (menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleScroll() {
      updateMenuPosition();
    }

    function handleResize() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    window.addEventListener("scroll", handleScroll, true);

    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);

      window.removeEventListener("scroll", handleScroll, true);

      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleView() {
    closeMenu();
    onView(user);
  }

  function handleEdit() {
    closeMenu();
    onEdit(user);
  }

  function handleStatusChange(status: UserStatus) {
    closeMenu();

    if (user.status === status) {
      return;
    }

    onStatusChange(user, status);
  }

  function handleRevokeSessions() {
    closeMenu();
    onRevokeSessions(user);
  }

  function handleDelete() {
    closeMenu();
    onDelete(user);
  }

  function handleRestore() {
    closeMenu();
    onRestore(user);
  }

  const isDeleted = user.isDeleted;
  const isActive = user.status === "ACTIVE";
  const isInactive = user.status === "INACTIVE";
  const isSuspended = user.status === "SUSPENDED";

  if (!mounted) {
    return (
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          aria-label={`Actions for ${user.email}`}
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-lg
            text-[var(--foreground-muted)]
          "
        >
          ⋮
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          aria-label={`Actions for ${user.email}`}
          aria-expanded={open}
          onClick={handleToggle}
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-[var(--foreground-muted)]
            transition
            hover:bg-[var(--background)]
            hover:text-[var(--foreground)]
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--primary)]/20
          "
        >
          ⋮
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="
              fixed
              z-[99999]
              w-56
              overflow-hidden
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-1
              shadow-xl
            "
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {/* View */}
            <button
              type="button"
              role="menuitem"
              onClick={handleView}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-left
                text-sm
                text-[var(--foreground)]
                transition
                hover:bg-[var(--background)]
              "
            >
              <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />

              <span>View Details</span>
            </button>

            {/* Edit */}
            {!isDeleted && (
              <button
                type="button"
                role="menuitem"
                onClick={handleEdit}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  text-[var(--foreground)]
                  transition
                  hover:bg-[var(--background)]
                "
              >
                <Pencil className="h-4 w-4 text-[var(--foreground-muted)]" />

                <span>Edit User</span>
              </button>
            )}

            <div className="my-1 border-t border-[var(--border)]" />

            {/* Active */}
            {!isDeleted && isActive && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("INACTIVE")}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-[var(--foreground)]
                    transition
                    hover:bg-[var(--background)]
                  "
                >
                  <UserX className="h-4 w-4 text-[var(--foreground-muted)]" />

                  <span>Deactivate User</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("SUSPENDED")}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-amber-600
                    transition
                    hover:bg-amber-50
                    dark:text-amber-400
                    dark:hover:bg-amber-950/30
                  "
                >
                  <ShieldAlert className="h-4 w-4" />

                  <span>Suspend User</span>
                </button>
              </>
            )}

            {/* Inactive */}
            {!isDeleted && isInactive && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("ACTIVE")}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-emerald-600
                    transition
                    hover:bg-emerald-50
                    dark:text-emerald-400
                    dark:hover:bg-emerald-950/30
                  "
                >
                  <UserCheck className="h-4 w-4" />

                  <span>Activate User</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("SUSPENDED")}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-amber-600
                    transition
                    hover:bg-amber-50
                    dark:text-amber-400
                    dark:hover:bg-amber-950/30
                  "
                >
                  <ShieldAlert className="h-4 w-4" />

                  <span>Suspend User</span>
                </button>
              </>
            )}

            {/* Suspended */}
            {!isDeleted && isSuspended && (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleStatusChange("ACTIVE")}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  text-emerald-600
                  transition
                  hover:bg-emerald-50
                  dark:text-emerald-400
                  dark:hover:bg-emerald-950/30
                "
              >
                <UserCheck className="h-4 w-4" />

                <span>Reactivate User</span>
              </button>
            )}

            {!isDeleted && (
              <>
                <div className="my-1 border-t border-[var(--border)]" />

                {/* Revoke sessions */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleRevokeSessions}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-[var(--foreground)]
                    transition
                    hover:bg-[var(--background)]
                  "
                >
                  <RotateCcw className="h-4 w-4 text-[var(--foreground-muted)]" />

                  <span>Revoke All Sessions</span>
                </button>
              </>
            )}

            <div className="my-1 border-t border-[var(--border)]" />

            {/* Delete */}
            {!isDeleted && (
              <button
                type="button"
                role="menuitem"
                onClick={handleDelete}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  text-[var(--danger)]
                  transition
                  hover:bg-[var(--danger-soft)]
                "
              >
                <Trash2 className="h-4 w-4" />

                <span>Delete User</span>
              </button>
            )}

            {/* Restore */}
            {isDeleted && (
              <button
                type="button"
                role="menuitem"
                onClick={handleRestore}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  text-emerald-600
                  transition
                  hover:bg-emerald-50
                  dark:text-emerald-400
                  dark:hover:bg-emerald-950/30
                "
              >
                <RotateCcw className="h-4 w-4" />

                <span>Restore User</span>
              </button>
            )}

            {/* Deleted indicator */}
            {isDeleted && (
              <div
                className="
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2.5
                  text-xs
                  text-[var(--foreground-muted)]
                "
              >
                <XCircle className="h-4 w-4" />

                <span>User is deleted</span>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
