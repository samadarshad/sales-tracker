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
  Code,
} from "@nextui-org/react";
import * as actions from "@/actions";
import { useFormState } from "react-dom";
import Image from "next/image";
import { useEffect, useState } from "react";
import Collapse from "@mui/material/Collapse";
import FormInput from "../common/form-input";
import FormButton from "../common/form-button";
import { toast } from "react-toastify";
export default function TrackerCreateForm() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [formState, action] = useFormState(actions.setWebsiteUrl, {
    errors: {},
  });
  const [aiFormState, aiAction] = useFormState(actions.testAiPrompt, {
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

  useEffect(() => {
    toast.error(formState.errors._form?.join(", "));
  }, [formState.errors._form]);

  const closeHandler = async (save?: boolean) => {
    onClose();
    if (!formState.tracker) {
      return;
    }
    if (save) {
      await actions.saveTracker(formState.tracker);
    } else {
      await clearWebsite();
      await actions.removeTracker(formState.tracker);
    }
  };

  // use form state, with the url to the image as the return, and any errors

  return (
    <>
      <Button onPress={onOpen}>Create a Tracker</Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        onClose={closeHandler}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create a Tracker
              </ModalHeader>
              <ModalBody>
                <form action={verifyWebsite}>
                  <FormInput
                    loaded={imageLoaded && collapseImage}
                    clearWebsite={clearWebsite}
                    errorMessage={formState.errors.websiteUrl?.join(", ")}
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
                      {formState.tracker?.previewUrl ? (
                        <Image
                          src={formState.tracker?.previewUrl}
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
                      <form action={aiAction}>
                        <div className="flex flex-col gap-1">
                          <Textarea
                            name="ai-prompt"
                            label="AI Prompt"
                            placeholder="Given the following website image, identify whether there is a sale, promotion, or any offer currently going on. Respond with either ‘yes’ if there is a sale or ‘no’ if there is no sale or it is unclear."
                          />
                          <div className="flex justify-between">
                            <div>
                              <FormButton>Test</FormButton>
                            </div>
                            <div>
                              <Collapse
                                in={!!aiFormState.response}
                                orientation="horizontal"
                              >
                                <div className="flex gap-1 items-center">
                                  <p className="text-bold">Response: </p>
                                  <Code>{aiFormState.response}</Code>
                                </div>
                              </Collapse>
                            </div>
                          </div>
                        </div>
                      </form>
                    </AccordionItem>
                  </Accordion>
                </Collapse>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => closeHandler()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => closeHandler(true)}
                  // isDisabled={true}
                >
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
