"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Accordion,
  AccordionItem,
  Textarea,
} from "@nextui-org/react";
import * as actions from "@/actions";
import { useFormState } from "react-dom";
import Image from "next/image";
import { useEffect, useState } from "react";
import Collapse from "@mui/material/Collapse";
import FormInput from "../common/form-input";
export default function TrackerCreateForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formState, action] = useFormState(actions.setWebsiteUrl, {
    errors: {},
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [collapseImage, setCollapseImage] = useState(false);

  const verifyWebsite = async (formData: FormData) => {
    setImageLoaded(false);
    setCollapseImage(false);
    await action(formData);
  };

  const clearWebsite = async () => {
    setImageLoaded(false);
    setCollapseImage(false);
    await action(new FormData());
  };

  useEffect(() => {
    setImageLoaded(false);
  }, [formState]);

  // use form state, with the url to the image as the return, and any errors

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
                <form action={verifyWebsite}>
                  <FormInput
                    loaded={imageLoaded && collapseImage}
                    clearWebsite={clearWebsite}
                  />
                </form>
                <Collapse in={imageLoaded && collapseImage}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <h3 className="font-bold">Website Preview</h3>
                      <p className="text-gray-600 font-thin">
                        Ensure the sale is clearly visible in the preview for
                        the AI to detect it
                      </p>
                    </div>
                    <div className="col-span-2">
                      {formState.previewUrl ? (
                        <Image
                          src={formState.previewUrl}
                          alt="logo"
                          width={1000}
                          height={160}
                          onLoad={() => {
                            setImageLoaded(true);
                            setCollapseImage(true);
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <Accordion>
                    <AccordionItem
                      title={
                        <h3 className="font-thin">(Advanced) AI Prompt</h3>
                      }
                      className="-m-3"
                    >
                      <div className="items-center flex flex-col gap-1">
                        <Textarea
                          name="ai-prompt"
                          label="AI Prompt"
                          placeholder="Given the following website image, identify whether there is a sale currently going on. Respond with either ‘yes’ if there is a sale or ‘no’ if there is no sale or it is unclear."
                        />
                        <Button color="default">Test</Button>
                      </div>
                    </AccordionItem>
                  </Accordion>
                </Collapse>
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
