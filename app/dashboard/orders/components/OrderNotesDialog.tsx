"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EditOrderStatus, AgentNote } from "../orders";
import { Order } from "../page";

interface OrderNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: Order;
  orderId: string;
  currentUser: any;
  onNotesUpdated: () => void;
  roleSettings: any;
}

export default function OrderNotesDialog({
  open,
  onOpenChange,
  orderData,
  orderId,
  currentUser,
  onNotesUpdated,
  roleSettings,
}: OrderNotesDialogProps) {
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [noteType, setNoteType] = useState<"agent" | "internal">("agent");

  const existingNotes: AgentNote[] = Array.isArray(orderData?.notes)
    ? orderData.notes
    : [];

  const handleSaveNote = async () => {
    if (!newNote.trim()) {
      toast.error("Note content cannot be empty.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token not found.");
      return;
    }

    setIsSaving(true);
    try {
      const userName = currentUser
        ? `${currentUser.first_name} ${currentUser.last_name}`
        : "Unknown User";

      const newNoteObj: AgentNote = {
        note: newNote.trim(),
        name: userName,
        date: new Date().toISOString(),
        internal: noteType === "internal" ? "true" : "false",
      };

      const updatedNotes = [...existingNotes, newNoteObj];

      const payload = {
        order_status: orderData.order_status,
        notes: updatedNotes,
        _method: "PUT",
      };

      await EditOrderStatus(orderId, payload, token);
      
      toast.success("Note added successfully");
      setNewNote("");
      onNotesUpdated();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-alexandria">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold uppercase"
            style={{ color: roleSettings?.pageTabColor || "#000" }}
          >
            Order Notes
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {existingNotes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {existingNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md border border-[#E4E4E4] bg-[#F9F9F9]"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-[14px]">
                      {note.name || "System"}
                      {(note.internal === "true" || (note as any).is_internal === true) && (
                        <span className="ml-2 text-[10px] bg-[#E06D5E] text-white px-2 py-0.5 rounded-full uppercase">Internal</span>
                      )}
                    </span>
                    <span className="text-[12px] text-gray-500">
                      {new Date(note.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#424242] whitespace-pre-wrap">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-gray-500 italic text-center py-4">
              No notes found for this order.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[#424242]">
              Add a New Note
            </label>
            <div className="flex gap-4 mb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="noteType"
                  value="agent"
                  checked={noteType === "agent"}
                  onChange={() => setNoteType("agent")}
                  className="accent-[#4290E9] w-4 h-4 cursor-pointer"
                />
                <span className="text-[14px] text-[#424242]">Viewable by agent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="noteType"
                  value="internal"
                  checked={noteType === "internal"}
                  onChange={() => setNoteType("internal")}
                  className="accent-[#4290E9] w-4 h-4 cursor-pointer"
                />
                <span className="text-[14px] text-[#424242]">Internal only</span>
              </label>
            </div>
            <textarea
              className="w-full min-h-[100px] p-3 border border-[#BBBBBB] rounded-md focus:outline-none focus:ring-1 text-[14px]"
              style={{
                backgroundColor: `color-mix(in srgb, ${roleSettings?.pageBg || "#fff"} 95%, black)`,
                color: roleSettings?.pageText || "#000",
              }}
              placeholder="Type your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveNote}
            disabled={isSaving || !newNote.trim()}
            style={{
              backgroundColor: roleSettings?.pageTabColor || "#4290E9",
              color: "#FFFFFF",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
