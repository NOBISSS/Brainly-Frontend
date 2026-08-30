import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { CrossIcon } from "../icons/CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";

import {
    addCollaborator,
    createWorkspace as createWorkspaceThunk,
} from "../redux/slices/workspaceSlice";

interface CreateWorkspaceModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateWorkspaceModal({
    open,
    onClose,
    onSuccess,
}: CreateWorkspaceModalProps) {
    const nameRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const [collaborators, setCollaborators] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const dispatch = useDispatch<AppDispatch>();

    const workspaces = useSelector(
        (state: RootState) => state.workspaces.workspaces
    );

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // --------------------------------------------------
    // Add collaborator
    // --------------------------------------------------

    const handleAddCollaborator = () => {
        const email = emailRef.current?.value
            ?.trim()
            .toLowerCase();

        if (!email) {
            toast.error("Enter a collaborator email");
            return;
        }

        if (!isValidEmail(email)) {
            toast.error("Enter a valid email");
            return;
        }

        if (collaborators.includes(email)) {
            toast.error("Collaborator already added");
            return;
        }

        setCollaborators((prev) => [
            ...prev,
            email,
        ]);

        if (emailRef.current) {
            emailRef.current.value = "";
            emailRef.current.focus();
        }
    };

    // --------------------------------------------------
    // Remove collaborator
    // --------------------------------------------------

    const removeCollaborator = (email: string) => {
        setCollaborators((prev) =>
            prev.filter((item) => item !== email)
        );
    };

    // --------------------------------------------------
    // Create workspace
    // --------------------------------------------------

    const createWorkspace = async () => {
        const name =
            nameRef.current?.value.trim() || "";

        const description =
            descRef.current?.value.trim() || "";

        if (!name) {
            toast.error(
                "Workspace name is required"
            );

            nameRef.current?.focus();

            return;
        }

        if (name.length < 2) {
            toast.error(
                "Workspace name must be at least 2 characters"
            );

            nameRef.current?.focus();

            return;
        }

        if (isCreating) return;

        try {
            setIsCreating(true);

            // ------------------------------------------
            // Create workspace
            // ------------------------------------------

            const created = await dispatch(
                createWorkspaceThunk({
                    name,
                    description,
                })
            ).unwrap();

            const workspaceId = created?._id;

            if (!workspaceId) {
                throw new Error(
                    "Workspace ID missing after creation"
                );
            }

            // ------------------------------------------
            // Add collaborators
            // ------------------------------------------

            let failedCollaborators = 0;

            for (const email of collaborators) {
                try {
                    await dispatch(
                        addCollaborator({
                            workspaceId,
                            email,
                        })
                    ).unwrap();
                } catch (error) {
                    console.error(
                        `Failed to add ${email}`,
                        error
                    );

                    failedCollaborators++;
                }
            }

            // ------------------------------------------
            // Success messages
            // ------------------------------------------

            if (failedCollaborators === 0) {
                if (collaborators.length > 0) {
                    toast.success(
                        `Workspace created with ${collaborators.length} collaborator${
                            collaborators.length > 1
                                ? "s"
                                : ""
                        }`
                    );
                } else {
                    toast.success(
                        "Workspace created successfully"
                    );
                }
            } else {
                toast.success(
                    "Workspace created, but some collaborators couldn't be added"
                );
            }

            onSuccess?.();

            resetForm();

            onClose();
        } catch (err: any) {
            console.error(
                "CREATE WORKSPACE ERROR:",
                err
            );

            toast.error(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to create workspace"
            );
        } finally {
            setIsCreating(false);
        }
    };

    // --------------------------------------------------
    // Reset
    // --------------------------------------------------

    const resetForm = () => {
        if (nameRef.current) {
            nameRef.current.value = "";
        }

        if (descRef.current) {
            descRef.current.value = "";
        }

        if (emailRef.current) {
            emailRef.current.value = "";
        }

        setCollaborators([]);
    };

    // --------------------------------------------------
    // Close modal
    // --------------------------------------------------

    const handleClose = () => {
        if (isCreating) return;

        resetForm();
        onClose();
    };

    // --------------------------------------------------
    // Enter key for collaborator
    // --------------------------------------------------

    const handleEmailKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleAddCollaborator();
        }
    };

    // --------------------------------------------------
    // Escape key
    // --------------------------------------------------

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape" &&
                !isCreating
            ) {
                handleClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, isCreating]);

    // --------------------------------------------------
    // Focus workspace name
    // --------------------------------------------------

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            nameRef.current?.focus();
        }, 150);

        return () => clearTimeout(timer);
    }, [open]);

    if (!open) return null;

    const canCreate =
        Boolean(
            nameRef.current?.value?.trim()
        ) && !isCreating;

    return (
        <AnimatePresence>
            <>
                {/* ================================== */}
                {/* Overlay */}
                {/* ================================== */}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.2,
                    }}
                    className="
                        fixed
                        inset-0
                        z-40
                        bg-black/40
                        backdrop-blur-sm
                    "
                    onClick={handleClose}
                />

                {/* ================================== */}
                {/* Modal */}
                {/* ================================== */}

                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        p-4
                        sm:p-6
                    "
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        className="
                            relative
                            w-full
                            max-w-lg
                            max-h-[90vh]
                            overflow-y-auto
                            rounded-2xl
                            border
                            border-gray-100
                            bg-white
                            p-5
                            shadow-2xl
                            sm:p-6
                        "
                    >
                        {/* ================================== */}
                        {/* Header */}
                        {/* ================================== */}

                        <div className="
                            mb-6
                            flex
                            items-start
                            justify-between
                        ">
                            <div>
                                <div className="
                                    flex
                                    items-center
                                    gap-2.5
                                ">
                                    <div className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-purple-100
                                        text-lg
                                    ">
                                        🗂️
                                    </div>

                                    <div>
                                        <h1 className="
                                            text-xl
                                            font-semibold
                                            tracking-tight
                                            text-gray-900
                                            sm:text-2xl
                                        ">
                                            Create Workspace
                                        </h1>

                                        <p className="
                                            mt-0.5
                                            text-sm
                                            text-gray-500
                                        ">
                                            Organize your content
                                            in one place
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isCreating}
                                aria-label="Close modal"
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-gray-400
                                    transition
                                    hover:bg-gray-100
                                    hover:text-gray-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                <CrossIcon />
                            </button>
                        </div>

                        {/* ================================== */}
                        {/* Workspace details */}
                        {/* ================================== */}

                        <div className="space-y-5">

                            {/* Workspace name */}

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="workspace-name"
                                    className="
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    "
                                >
                                    Workspace name
                                </label>

                                <Input
                                    reference={nameRef}
                                    placeholder="e.g. My Projects"
                                    id="workspace-name"
                                />

                                <p className="
                                    text-xs
                                    text-gray-400
                                ">
                                    Give your workspace a
                                    name that is easy to
                                    recognize.
                                </p>
                            </div>

                            {/* Description */}

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="workspace-description"
                                    className="
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    "
                                >
                                    Description
                                    <span className="
                                        ml-1
                                        font-normal
                                        text-gray-400
                                    ">
                                        (optional)
                                    </span>
                                </label>

                                <Input
                                    reference={descRef}
                                    placeholder="What will you use this workspace for?"
                                    id="workspace-description"
                                />
                            </div>
                        </div>

                        {/* ================================== */}
                        {/* Collaborators */}
                        {/* ================================== */}

                        <div className="
                            mt-7
                            rounded-xl
                            border
                            border-gray-200
                            bg-gray-50/70
                            p-4
                        ">
                            <div className="mb-3">
                                <div className="
                                    flex
                                    items-center
                                    justify-between
                                ">
                                    <div>
                                        <h2 className="
                                            text-sm
                                            font-semibold
                                            text-gray-800
                                        ">
                                            Collaborators
                                        </h2>

                                        <p className="
                                            mt-0.5
                                            text-xs
                                            text-gray-400
                                        ">
                                            Invite people to
                                            work with you
                                        </p>
                                    </div>

                                    {collaborators.length >
                                        0 && (
                                        <span className="
                                            rounded-full
                                            bg-purple-100
                                            px-2.5
                                            py-1
                                            text-xs
                                            font-medium
                                            text-purple-700
                                        ">
                                            {
                                                collaborators.length
                                            }{" "}
                                            added
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Add email */}

                            <div className="
                                flex
                                flex-col
                                gap-2
                                sm:flex-row
                            ">
                                <div className="min-w-0 flex-1">
                                    <Input
                                        reference={emailRef}
                                        type="email"
                                        placeholder="name@example.com"
                                        onKeyDown={
                                            handleEmailKeyDown
                                        }
                                    />
                                </div>

                                <Button
                                    onClick={
                                        handleAddCollaborator
                                    }
                                    variant="Primary"
                                    text="Add"
                                />
                            </div>

                            <p className="
                                mt-2
                                text-xs
                                text-gray-400
                            ">
                                Press Enter or click Add to
                                add another collaborator.
                            </p>

                            {/* Collaborator list */}

                            <AnimatePresence>
                                {collaborators.length >
                                    0 && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            height: 0,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            height: 0,
                                        }}
                                        className="
                                            mt-4
                                            max-h-40
                                            space-y-2
                                            overflow-y-auto
                                            pr-1
                                        "
                                    >
                                        {collaborators.map(
                                            (email) => (
                                                <motion.div
                                                    key={email}
                                                    initial={{
                                                        opacity: 0,
                                                        x: -5,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        x: 5,
                                                    }}
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-3
                                                        rounded-lg
                                                        border
                                                        border-gray-200
                                                        bg-white
                                                        px-3
                                                        py-2.5
                                                    "
                                                >
                                                    <div className="
                                                        flex
                                                        min-w-0
                                                        items-center
                                                        gap-2.5
                                                    ">
                                                        <div className="
                                                            flex
                                                            h-8
                                                            w-8
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-purple-100
                                                            text-xs
                                                            font-semibold
                                                            text-purple-700
                                                        ">
                                                            {email
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <span className="
                                                            truncate
                                                            text-sm
                                                            text-gray-700
                                                        ">
                                                            {email}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeCollaborator(
                                                                email
                                                            )
                                                        }
                                                        disabled={
                                                            isCreating
                                                        }
                                                        className="
                                                            shrink-0
                                                            rounded-md
                                                            px-2
                                                            py-1
                                                            text-xs
                                                            font-medium
                                                            text-red-500
                                                            transition
                                                            hover:bg-red-50
                                                            hover:text-red-600
                                                            disabled:opacity-50
                                                        "
                                                    >
                                                        Remove
                                                    </button>
                                                </motion.div>
                                            )
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ================================== */}
                        {/* Summary */}
                        {/* ================================== */}

                        {(nameRef.current?.value ||
                            collaborators.length >
                                0) && (
                            <div className="
                                mt-5
                                rounded-xl
                                border
                                border-purple-100
                                bg-purple-50/60
                                p-3.5
                            ">
                                <div className="
                                    flex
                                    items-center
                                    gap-2
                                    text-xs
                                    text-purple-700
                                ">
                                    <span>✨</span>

                                    <span>
                                        Your workspace will be
                                        created
                                        {collaborators.length >
                                            0 &&
                                            ` with ${collaborators.length} collaborator${
                                                collaborators.length >
                                                1
                                                    ? "s"
                                                    : ""
                                            }`}
                                        .
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ================================== */}
                        {/* Submit */}
                        {/* ================================== */}

                        <div className="mt-6">
                            <Button
                                onClick={createWorkspace}
                                variant="Primary"
                                text={
                                    isCreating
                                        ? "Creating workspace..."
                                        : "Create Workspace"
                                }
                                fullWidth={true}
                                disabled={isCreating}
                            />

                            <p className="
                                mt-2
                                text-center
                                text-xs
                                text-gray-400
                            ">
                                You can add or manage
                                collaborators later.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
}