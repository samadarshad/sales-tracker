"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Skeleton,
  Accordion,
  AccordionItem,
  Textarea,
} from "@nextui-org/react";

export default function TrackerCreateForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button onPress={onOpen}>Create a Tracker</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create a Tracker
              </ModalHeader>
              <ModalBody>
                <Input
                  name="website-url"
                  label="Website URL"
                  placeholder="e.g. www.udacity.com"
                />
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <h3 className="font-bold">Website Preview</h3>
                    <p className="text-gray-600 font-thin">
                      Ensure the sale is clearly visible in the preview for the
                      AI to detect it
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Skeleton disableAnimation={true}>
                      <div className="w-full h-40"></div>
                    </Skeleton>
                  </div>
                </div>
                <Accordion>
                  <AccordionItem title="(Advanced) AI Prompt" className="-m-3">
                    <Textarea
                      name="ai-prompt"
                      label="AI Prompt"
                      placeholder="Given the following website image, identify whether there is a sale currently going on. Respond with either ‘yes’ if there is a sale or ‘no’ if there is no sale or it is unclear."
                    />
                  </AccordionItem>
                </Accordion>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={onClose}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
