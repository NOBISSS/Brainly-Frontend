import { memo, useState } from "react";
import { motion } from "framer-motion";
import { MdDelete } from "react-icons/md";

import { getCategoryIcon } from "@/utils/getCategoryIcon";

interface Link {
    _id?: string;
    url: string;
    title: string;
    thumbnail?: string;
    category: string;
    createdBy?: {
        _id: string;
        name: string;
        avatar?: string;
    };
}

interface Props {
    link: Link;
    user: any;
    onDelete: (id: string, title: string) => void;
}

function LinkCard({
    link,
    user,
    onDelete,
}: Props) {
    const {
        url,
        title,
        thumbnail,
        _id,
        createdBy,
        category,
    } = link;

    const [imageError, setImageError] = useState(false);

    const { icon, bg } =
        getCategoryIcon(category);

    if (!_id) return null;

    const showThumbnail =
        Boolean(thumbnail) && !imageError;

    return (
        <motion.article
            layout
            whileHover={{
                y: -4,
                scale: 1.015,
            }}
            transition={{
                duration: 0.18,
                ease: "easeOut",
            }}
            className="
                group
                relative
                min-h-[190px]
                overflow-hidden
                rounded-2xl
                bg-white
                shadow-sm
                ring-1
                ring-black/5
                transition-shadow
                hover:shadow-xl
            "
        >
            {showThumbnail ? (
                <img
                    src={thumbnail}
                    alt=""
                    loading="lazy"
                    onError={() =>
                        setImageError(true)
                    }
                    className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-500
                        group-hover:scale-105
                    "
                />
            ) : (
                <div className="
                    absolute
                    inset-0
                    bg-gradient-to-br
                    from-purple-500
                    via-purple-600
                    to-indigo-700
                " />
            )}

            <div className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/85
                via-black/55
                to-black/25
            " />

            <div className="
                relative
                flex
                min-h-[190px]
                flex-col
                justify-between
                p-5
            ">
                <div className="
                    flex
                    items-start
                    justify-between
                    gap-3
                ">
                    <h2 className="
                        line-clamp-2
                        min-w-0
                        text-base
                        font-semibold
                        leading-6
                        text-white
                    ">
                        {title || "Untitled"}
                    </h2>

                    <button
                        type="button"
                        aria-label={`Delete ${title}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(_id, title);
                        }}
                        className="
                            shrink-0
                            rounded-lg
                            p-1.5
                            text-white/70
                            transition
                            hover:bg-red-500/20
                            hover:text-red-400
                            focus:outline-none
                            focus:ring-2
                            focus:ring-red-400/50
                        "
                    >
                        <MdDelete className="text-xl" />
                    </button>
                </div>

                <div className="mt-4">
                    <p
                        title={url}
                        className="
                            truncate
                            text-sm
                            text-white/75
                        "
                    >
                        {url}
                    </p>

                    <div className="
                        mt-4
                        flex
                        items-center
                        justify-between
                        gap-3
                    ">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                            className="
                                rounded-lg
                                bg-white/10
                                px-3
                                py-2
                                text-sm
                                font-medium
                                text-white
                                backdrop-blur-sm
                                transition
                                hover:bg-white/20
                            "
                        >
                            Open Link
                            <span className="ml-1">
                                →
                            </span>
                        </a>

                        {createdBy && (
                            <div className="group/avatar relative">
                                <img
                                    src={
                                        createdBy.avatar ||
                                        "/default-avatar.png"
                                    }
                                    alt={
                                        createdBy.name ||
                                        "User"
                                    }
                                    className="
                                        h-9
                                        w-9
                                        rounded-full
                                        border-2
                                        border-white/60
                                        object-cover
                                        shadow-md
                                    "
                                />

                                <div
                                    className={`
                                        absolute
                                        -bottom-1
                                        -right-1
                                        flex
                                        h-5
                                        w-5
                                        items-center
                                        justify-center
                                        rounded-full
                                        border-2
                                        border-white/80
                                        ${bg}
                                    `}
                                >
                                    {icon}
                                </div>

                                <div className="
                                    pointer-events-none
                                    absolute
                                    bottom-full
                                    right-0
                                    mb-2
                                    whitespace-nowrap
                                    rounded-lg
                                    bg-black/90
                                    px-2.5
                                    py-1.5
                                    text-xs
                                    text-white
                                    opacity-0
                                    shadow-lg
                                    transition
                                    group-hover/avatar:opacity-100
                                ">
                                    {createdBy.name === user?.name
                                        ? "You"
                                        : createdBy.name}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

export default memo(LinkCard);