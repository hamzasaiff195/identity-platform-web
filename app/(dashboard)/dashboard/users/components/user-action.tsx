"use client";

import { createPortal } from "react-dom";
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

  /**
   * Calculate the menu position relative to the
   * three-dot button.
   *
   * Because the menu uses `position: fixed`,
   * getBoundingClientRect() gives us exactly
   * the coordinates we need.
   */
  function updateMenuPosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();

    const menuElement = menuRef.current;

    /*
     * Use the real menu height when available.
     * This is much more reliable than hard-coding
     * a menu height.
     */
    const menuHeight = menuElement?.offsetHeight ?? 360;

    /*
     * Align the right edge of the menu with the
     * right edge of the three-dot button.
     */
    let left = rect.right - MENU_WIDTH;

    /*
     * Default position:
     *
     *     [ button ]
     *          ↓
     *     [ menu   ]
     */
    let top = rect.bottom + MENU_GAP;

    /*
     * Prevent horizontal overflow on the left.
     */
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    /*
     * Prevent horizontal overflow on the right.
     */
    if (left + MENU_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
    }

    /*
     * If the menu doesn't fit below the button,
     * open it above the button.
     */
    const spaceBelow = window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    if (
      spaceBelow < menuHeight + MENU_GAP &&
      spaceAbove >= menuHeight + MENU_GAP
    ) {
      top = rect.top - menuHeight - MENU_GAP;
    }

    /*
     * Final vertical safety check.
     */
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
    if (!open) {
      setOpen(true);

      /*
       * Wait until the portal/menu has rendered,
       * then calculate its real height.
       */
      requestAnimationFrame(() => {
        updateMenuPosition();
      });

      return;
    }

    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * Recalculate after the menu is mounted.
     */
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

    /*
     * Capture scrolling from the table's overflow container
     * as well as the window.
     */
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
      {/* Action trigger */}
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
            text-lg
            leading-none
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
              className="menu-item"
            >
              <span className="menu-icon">◉</span>

              <span>View Details</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              role="menuitem"
              onClick={handleEdit}
              className="menu-item"
            >
              <span className="menu-icon">✎</span>

              <span>Edit User</span>
            </button>

            <div className="my-1 border-t border-[var(--border)]" />

            {/* Active */}
            {isActive && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("INACTIVE")}
                  className="menu-item"
                >
                  <span className="menu-icon">○</span>

                  <span>Deactivate User</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("SUSPENDED")}
                  className="menu-item"
                >
                  <span className="menu-icon text-amber-500">!</span>

                  <span>Suspend User</span>
                </button>
              </>
            )}

            {/* Inactive */}
            {isInactive && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("ACTIVE")}
                  className="menu-item"
                >
                  <span className="menu-icon text-emerald-500">●</span>

                  <span>Activate User</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusChange("SUSPENDED")}
                  className="menu-item"
                >
                  <span className="menu-icon text-amber-500">!</span>

                  <span>Suspend User</span>
                </button>
              </>
            )}

            {/* Suspended */}
            {isSuspended && (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleStatusChange("ACTIVE")}
                className="menu-item"
              >
                <span className="menu-icon text-emerald-500">●</span>

                <span>Reactivate User</span>
              </button>
            )}

            <div className="my-1 border-t border-[var(--border)]" />

            {/* Revoke sessions */}
            <button
              type="button"
              role="menuitem"
              onClick={handleRevokeSessions}
              className="menu-item"
            >
              <span className="menu-icon">↻</span>

              <span>Revoke All Sessions</span>
            </button>

            <div className="my-1 border-t border-[var(--border)]" />

            {/* Delete */}
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
              <span className="flex w-5 justify-center">🗑</span>

              <span>Delete User</span>
            </button>

            {/* Restore */}
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
              <span className="flex w-5 justify-center">↶</span>

              <span>Restore User</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
