import { CrossIcon } from "../icons/CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { detectLinkType } from "../utils/detectLinkType";
import { useDispatch, useSelector } from "react-redux";
import { addLink } from "../redux/slices/linkSlice";
import { fetchWorkspaces as FetchWorkspacesThunk } from "../redux/slices/workspaceSlice";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { motion, AnimatePresence } from "framer-motion";

// shadcn
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { LINK_TYPES as types } from "@/constants/frConstant";

interface CreateContentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateContentModalV2({
    open,
    onClose,
    onSuccess,
}: CreateContentModalProps) {
    const lastFetchedUrlRef = useRef<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoType, setIsAutoType] = useState(false);
    const [isFetchingOG, setIsFetchingOG] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);

    const [workspace, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");

    const workspaceRef = useRef<HTMLButtonElement>(null);

    const dispatch = useDispatch();

    const userEditedTitle = useRef(false);
    const userEditedThumbnail = useRef(false);

    const SelectedWorkspace = useSelector(
        (state: any) => state.workspaces?.selected
    ) || "";

    // --------------------------------------------------
    // URL validation
    // --------------------------------------------------

    const isValidUrl = (value: string) => {
        try {
            const url = new URL(value);

            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );
        } catch {
            return false;
        }
    };

    // --------------------------------------------------
    // Fetch OpenGraph preview
    // --------------------------------------------------

    const fetchOGPreview = async (url: string) => {
        if (!url || !isValidUrl(url)) return;

        // Prevent duplicate requests
        if (lastFetchedUrlRef.current === url) {
            return;
        }

        lastFetchedUrlRef.current = url;

        setIsFetchingOG(true);
        setThumbnailError(false);

        try {
            const res = await axios.get(
                BACKEND_URL +
                `api/links/preview?url=${encodeURIComponent(url)}`,
                {
                    withCredentials: true,
                }
            );

            if (
                res.data?.title &&
                !userEditedTitle.current
            ) {
                setTitle(res.data.title);
            }

            if (
                res.data?.thumbnail &&
                !userEditedThumbnail.current
            ) {
                setThumbnail(res.data.thumbnail);
                setThumbnailError(false);
            }
        } catch (error) {
            console.log("OG FETCH FAILED", error);

            // Allow retrying if request failed
            lastFetchedUrlRef.current = null;
        } finally {
            setIsFetchingOG(false);
        }
    };

    // --------------------------------------------------
    // Detect link type
    // --------------------------------------------------

    const handleLinkChange = (value: string) => {
        if (!value.trim()) {
            setSelectedType("");
            setIsAutoType(false);
            return;
        }

        const detectedType = detectLinkType(value);

        if (
            detectedType &&
            detectedType !== "unknown"
        ) {
            setSelectedType(detectedType);
            setIsAutoType(true);
        }
    };

    // --------------------------------------------------
    // Process URL input
    // --------------------------------------------------

    const processLink = (value: string) => {
        setLink(value);

        handleLinkChange(value);

        setThumbnail(null);
        setThumbnailError(false);

        setTitle("");

        setIsAutoType(false);

        lastFetchedUrlRef.current = null;

        userEditedTitle.current = false;
        userEditedThumbnail.current = false;
    };

    // --------------------------------------------------
    // Reset modal
    // --------------------------------------------------

    const handleClose = () => {
        if (isSubmitting) return;

        setLink("");
        setTitle("");
        setThumbnail(null);
        setThumbnailError(false);

        setSelectedType("");
        setSelectedWorkspace("");

        setIsAutoType(false);
        setIsSubmitting(false);
        setIsFetchingOG(false);

        lastFetchedUrlRef.current = null;

        userEditedTitle.current = false;
        userEditedThumbnail.current = false;

        onClose();
    };

    // --------------------------------------------------
    // Create link
    // --------------------------------------------------

    const createLink = async () => {
        if (!selectedWorkspace) {
            toast.error("Please select a workspace");
            workspaceRef.current?.focus();
            return;
        }

        if (!link.trim()) {
            toast.error("Please enter a link");
            return;
        }

        if (!isValidUrl(link)) {
            toast.error("Please enter a valid URL");
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);

        const detectedType = detectLinkType(link);

        const type =
            selectedType ||
            detectedType ||
            "unknown";

        try {
            await dispatch(
                addLink({
                    title: title.trim() || "Untitled",
                    url: link.trim(),
                    category: type.toUpperCase(),
                    workspace: selectedWorkspace,
                })
            ).unwrap();

            toast.success("Link created successfully");

            onSuccess?.();

            handleClose();
        } catch (error: any) {
            console.log("CREATE LINK ERROR:", error);

            toast.error(
                error?.message ||
                "Failed to create link. Try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // --------------------------------------------------
    // Fetch preview after user stops typing
    // --------------------------------------------------

    useEffect(() => {
        if (!link.trim()) return;

        if (!isValidUrl(link)) return;

        const id = setTimeout(() => {
            fetchOGPreview(link);
        }, 600);

        return () => clearTimeout(id);
    }, [link]);

    // --------------------------------------------------
    // Set selected workspace
    // --------------------------------------------------

    useEffect(() => {
        if (
            open &&
            SelectedWorkspace?._id
        ) {
            setSelectedWorkspace(
                SelectedWorkspace._id
            );
        }
    }, [open, SelectedWorkspace]);

    // --------------------------------------------------
    // Fetch workspaces
    // --------------------------------------------------

    useEffect(() => {
        if (!open) return;

        const fetchWorkspaces = async () => {
            try {
                const workspacesData =
                    await dispatch(
                        FetchWorkspacesThunk()
                    ).unwrap();

                setWorkspaces(
                    workspacesData || []
                );
            } catch (error) {
                console.log(
                    "Failed to fetch workspaces",
                    error
                );

                toast.error(
                    "Failed to load workspaces"
                );
            }
        };

        fetchWorkspaces();
    }, [open, dispatch]);

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
                !isSubmitting
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
    }, [open, isSubmitting]);

    if (!open) return null;

    const canSubmit =
        Boolean(
            selectedWorkspace &&
            link.trim() &&
            isValidUrl(link)
        ) && !isSubmitting;

    return (
        <AnimatePresence>
            <>
                {/* -------------------------------- */}
                {/* Overlay */}
                {/* -------------------------------- */}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="
                        fixed
                        inset-0
                        z-40
                        bg-black/40
                        backdrop-blur-sm
                    "
                    onClick={handleClose}
                />

                {/* -------------------------------- */}
                {/* Modal container */}
                {/* -------------------------------- */}

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
                            max-w-md
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
                        {/* -------------------------------- */}
                        {/* Header */}
                        {/* -------------------------------- */}

                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h1 className="
                                    text-xl
                                    font-semibold
                                    tracking-tight
                                    text-gray-900
                                    sm:text-2xl
                                ">
                                    Add Link
                                </h1>

                                <p className="
                                    mt-1
                                    text-sm
                                    text-gray-500
                                ">
                                    Save a link to your workspace
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                aria-label="Close modal"
                                className="
                                    flex
                                    h-9
                                    w-9
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

                        {/* -------------------------------- */}
                        {/* Form */}
                        {/* -------------------------------- */}

                        <div className="space-y-5">

                            {/* Link */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="content-link"
                                    className="
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    "
                                >
                                    Link
                                </label>

                                <Input
                                    value={link}
                                    placeholder="Paste a URL..."
                                    onChange={(e) =>
                                        processLink(
                                            e.target.value
                                        )
                                    }
                                    id="content-link"
                                />

                                {link &&
                                    !isValidUrl(link) && (
                                        <p className="
                                            text-xs
                                            text-red-500
                                        ">
                                            Enter a valid URL
                                            starting with
                                            http:// or https://
                                        </p>
                                    )}
                            </div>

                            {/* Type */}
                            <div className="space-y-1.5">
                                <label className="
                                    text-sm
                                    font-medium
                                    text-gray-700
                                ">
                                    Content type
                                </label>

                                <Select
                                    value={selectedType}
                                    onValueChange={(value) => {
                                        setSelectedType(value);
                                        setIsAutoType(false);
                                    }}
                                >
                                    <SelectTrigger
                                        className="
                                            w-full
                                            border-gray-200
                                            bg-gray-50
                                            px-4
                                            py-2.5
                                            text-sm
                                            capitalize
                                            shadow-none
                                            transition-all
                                            hover:bg-gray-100
                                            focus:ring-2
                                            focus:ring-purple-500
                                            focus:ring-offset-0
                                        "
                                    >
                                        <SelectValue placeholder="Select content type" />
                                    </SelectTrigger>

                                    <SelectContent
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                        sideOffset={5}
                                        className="
                                            z-[100]
                                            w-[var(--radix-select-trigger-width)]
                                            max-h-60
                                            overflow-y-auto
                                            rounded-lg
                                            border
                                            border-gray-200
                                            bg-white
                                            text-gray-900
                                            shadow-xl
                                        "
                                    >
                                        <SelectGroup>
                                            <SelectLabel className="
                                                px-3
                                                py-2
                                                text-xs
                                                font-medium
                                                uppercase
                                                tracking-wider
                                                text-gray-400
                                            ">
                                                Types
                                            </SelectLabel>

                                            {types.map(
                                                (
                                                    type,
                                                    index
                                                ) => (
                                                    <SelectItem
                                                        key={index}
                                                        value={type}
                                                        className="
                                                            cursor-pointer
                                                            rounded-md
                                                            py-2
                                                            capitalize
                                                            focus:bg-purple-50
                                                            focus:text-purple-700
                                                        "
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                {isAutoType && (
                                    <motion.p
                                        initial={{
                                            opacity: 0,
                                            y: -3,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        className="
                                            flex
                                            items-center
                                            gap-1.5
                                            text-xs
                                            text-purple-600
                                        "
                                    >
                                        <span>✨</span>

                                        <span>
                                            Type detected
                                            automatically
                                        </span>

                                        <span className="text-gray-400">
                                            · You can change it
                                        </span>
                                    </motion.p>
                                )}
                            </div>

                            {/* Workspace */}
                            <div className="space-y-1.5">
                                <label className="
                                    text-sm
                                    font-medium
                                    text-gray-700
                                ">
                                    Workspace
                                </label>

                                <Select
                                    value={selectedWorkspace}
                                    onValueChange={(value) =>
                                        setSelectedWorkspace(
                                            value
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        ref={workspaceRef}
                                        className={`
                                            w-full
                                            px-4
                                            py-2.5
                                            text-sm
                                            shadow-none
                                            transition-all
                                            focus:ring-2
                                            focus:ring-purple-500
                                            focus:ring-offset-0
                                            ${!selectedWorkspace
                                                ? "border-red-300 bg-red-50"
                                                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                            }
                                        `}
                                    >
                                        <SelectValue placeholder="Select a workspace" />
                                    </SelectTrigger>

                                    <SelectContent
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                        sideOffset={5}
                                        className="
                                            z-[100]
                                            w-[var(--radix-select-trigger-width)]
                                            max-h-60
                                            overflow-y-auto
                                            rounded-lg
                                            border
                                            border-gray-200
                                            bg-white
                                            text-gray-900
                                            shadow-xl
                                        "
                                    >
                                        <SelectGroup>
                                            <SelectLabel className="
                                                px-3
                                                py-2
                                                text-xs
                                                font-medium
                                                uppercase
                                                tracking-wider
                                                text-gray-400
                                            ">
                                                Workspace
                                            </SelectLabel>

                                            {workspace.length ===
                                                0 && (
                                                    <div className="
                                                    px-3
                                                    py-4
                                                    text-center
                                                    text-sm
                                                    text-gray-400
                                                ">
                                                        No workspaces found
                                                    </div>
                                                )}

                                            {workspace.map(
                                                (ws: any) => (
                                                    <SelectItem
                                                        key={ws._id}
                                                        value={ws._id}
                                                        className="
                                                            cursor-pointer
                                                            rounded-md
                                                            py-2
                                                            focus:bg-purple-50
                                                            focus:text-purple-700
                                                        "
                                                    >
                                                        {ws.name}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                {!selectedWorkspace && (
                                    <p className="
                                        text-xs
                                        text-gray-400
                                    ">
                                        Choose where you want
                                        to save this link
                                    </p>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="content-title"
                                    className="
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    "
                                >
                                    Title
                                </label>

                                <Input
                                    id="content-title"
                                    value={title}
                                    placeholder="Title will be generated automatically"
                                    onChange={(e) => {
                                        userEditedTitle.current =
                                            true;

                                        setTitle(
                                            e.target.value
                                        );
                                    }}
                                />

                                <p className="
                                    text-xs
                                    text-gray-400
                                ">
                                    You can edit the title before
                                    saving.
                                </p>
                            </div>
                        </div>

                        {/* -------------------------------- */}
                        {/* Loading preview */}
                        {/* -------------------------------- */}

                        <AnimatePresence>
                            {isFetchingOG && (
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
                                        flex
                                        items-center
                                        gap-2
                                        text-sm
                                        text-gray-500
                                    "
                                >
                                    <div className="
                                        h-4
                                        w-4
                                        animate-spin
                                        rounded-full
                                        border-2
                                        border-purple-500
                                        border-t-transparent
                                    " />

                                    <span>
                                        Fetching link preview...
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* -------------------------------- */}
                        {/* Preview */}
                        {/* -------------------------------- */}

                        <AnimatePresence>
                            {thumbnail && !thumbnailError && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 10,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: 10,
                                    }}
                                    className="
                                        relative
                                        mt-5
                                        min-h-[190px]
                                        overflow-hidden
                                        rounded-2xl
                                        bg-gray-900
                                        shadow-md
                                    "
                                >
                                    {/* Image */}
                                    <img
                                        src={thumbnail}
                                        alt=""
                                        className="
                                            absolute
                                            inset-0
                                            h-full
                                            w-full
                                            object-cover
                                        "
                                        onError={() =>
                                            setThumbnailError(
                                                true
                                            )
                                        }
                                    />

                                    {/* Gradient */}
                                    <div className="
                                        absolute
                                        inset-0
                                        bg-gradient-to-t
                                        from-black/85
                                        via-black/40
                                        to-black/10
                                    " />

                                    {/* Content */}
                                    <div className="
                                        relative
                                        flex
                                        min-h-[190px]
                                        flex-col
                                        justify-end
                                        p-5
                                    ">
                                        <span className="
                                            mb-2
                                            w-fit
                                            rounded-full
                                            bg-white/15
                                            px-2.5
                                            py-1
                                            text-[11px]
                                            font-medium
                                            text-white
                                            backdrop-blur-sm
                                        ">
                                            Link Preview
                                        </span>

                                        <h2 className="
                                            line-clamp-2
                                            text-lg
                                            font-semibold
                                            leading-snug
                                            text-white
                                        ">
                                            {title ||
                                                "Untitled"}
                                        </h2>

                                        <p className="
                                            mt-1
                                            truncate
                                            text-sm
                                            text-white/70
                                        ">
                                            {link}
                                        </p>

                                        <a
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="
                                                mt-3
                                                w-fit
                                                text-sm
                                                font-medium
                                                text-purple-200
                                                transition
                                                hover:text-white
                                            "
                                        >
                                            Open Link →
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* -------------------------------- */}
                        {/* Fallback preview */}
                        {/* -------------------------------- */}

                        {thumbnailError && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 10,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="
                                    mt-5
                                    rounded-2xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    p-4
                                "
                            >
                                <div className="
                                    flex
                                    items-center
                                    gap-3
                                ">
                                    <div className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-purple-100
                                        text-lg
                                    ">
                                        🔗
                                    </div>

                                    <div className="min-w-0">
                                        <p className="
                                            truncate
                                            text-sm
                                            font-medium
                                            text-gray-800
                                        ">
                                            {title ||
                                                "Untitled"}
                                        </p>

                                        <p className="
                                            truncate
                                            text-xs
                                            text-gray-400
                                        ">
                                            {link}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* -------------------------------- */}
                        {/* Submit */}
                        {/* -------------------------------- */}

                        <div className="mt-6">
                            <Button
                                onClick={createLink}
                                variant="Primary"
                                text={
                                    isSubmitting
                                        ? "Saving..."
                                        : "Save Link"
                                }
                                fullWidth={true}
                                disabled={!canSubmit}
                            />

                            {!selectedWorkspace && (
                                <p className="
                                    mt-2
                                    text-center
                                    text-xs
                                    text-gray-400
                                ">
                                    Select a workspace to continue
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
}