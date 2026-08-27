"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ConfigProvider,
  Form,
  Input,
  Modal,
  Select,
  Alert,
  DatePicker,
  TimePicker 
} from "antd";
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { searchClientByPhone } from "@/lib/actions/appointments";
import dayjs from "dayjs";

export type ClientType = "Student" | "Client";

export type AppointmentFormValues = {
  name: string;
  age: string;
  relative: string;
  address: string;
  countryCode: string;
  phone: string;
  clientType: ClientType;
  scheduledDate?: string;
   scheduledTime?: string;
};

type ModalFormValues = Omit<AppointmentFormValues, "scheduledDate"> & {
  country: Country;
  scheduledDate?: dayjs.Dayjs | null;
  scheduledTime: any;
};

const blankForm: ModalFormValues = {
  name: "",
  age: "",
  relative: "",
  address: "",
  country: "IN",
  countryCode: "+91",
  phone: "",
  clientType: "Client",
  scheduledDate: dayjs(),
  scheduledTime: null as unknown as string,
};

const themeConfig = {
  token: {
    colorPrimary: "#2D5A3F",
    colorLink: "#144229",
    borderRadius: 6,
    controlHeight: 44,
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
  },
  components: {
    Input: {
      colorBgContainer: "#ffffff",
      colorBorder: "#c1c9c0",
      hoverBorderColor: "#2D5A3F",
      activeBorderColor: "#144229",
      activeShadow: "0 0 0 2px rgba(45, 90, 63, 0.15)",
    },
    Select: {
      colorBgContainer: "#ffffff",
      colorBorder: "#c1c9c0",
      hoverBorderColor: "#2D5A3F",
      activeBorderColor: "#144229",
      optionSelectedBg: "#bceecb",
      optionSelectedColor: "#144229",
      optionActiveBg: "#e8f7ee",
    },
    Button: {
      primaryColor: "#ffffff",
    },
  },
};

const selectPopupClassName =
  "[&_.ant-select-item-option-active]:bg-[#e8f7ee]! [&_.ant-select-item-option-selected]:bg-[#bceecb]! [&_.ant-select-item-option-selected]:text-[#144229]! [&_.ant-select-item-option-selected]:font-semibold!";

function CountryOptionLabel({
  country,
  showName = false,
}: {
  country: Country;
  showName?: boolean;
}) {
  const Flag = flags[country];
  const dial = `+${getCountryCallingCode(country)}`;

  return (
    <span className="flex items-center gap-2">
      {Flag ? (
        <span className="inline-flex h-3.5 w-5 overflow-hidden rounded-xs shadow-sm">
          <Flag title={country} />
        </span>
      ) : null}
      <span className="font-medium text-[#144229]">{dial}</span>
      {showName ? (
        <span className="truncate text-[#69746d]">{en[country]}</span>
      ) : null}
    </span>
  );
}

type AddAppointmentModalProps = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: AppointmentFormValues) => void;
  loading?: boolean;
  initialValues?: AppointmentFormValues;
  title?: string;
  submitText?: string;
};

export default function AddAppointmentModal({
  open,
  onCancel,
  onSubmit,
  loading = false,
  initialValues,
  title = "New appointment",
  submitText = "Create Appointment",
}: AddAppointmentModalProps) {
  const [form] = Form.useForm<ModalFormValues>();
  const selectedCountry = Form.useWatch("country", form) as Country | undefined;
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "searching" | "found" | "not_found"
  >("idle");
  const [pastAppointments, setPastAppointments] = useState<
    { id: string; status: string; created_at: string }[]
  >([]);

  const countryOptions = useMemo(
    () =>
      getCountries().map((country) => ({
        value: country,
        label: <CountryOptionLabel country={country} showName />,
        search: `${en[country]} ${getCountryCallingCode(country)} ${country}`,
      })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setLookupStatus("idle");
    setPastAppointments([]);

    if (!initialValues) {
      form.setFieldsValue(blankForm);
      return;
    }

    const country = getCountries().find(
      (item) => `+${getCountryCallingCode(item)}` === initialValues.countryCode,
    );
    form.setFieldsValue({
      ...initialValues,
      country: country ?? blankForm.country,
      scheduledDate: initialValues.scheduledDate
        ? dayjs(initialValues.scheduledDate)
        : dayjs(),
         scheduledTime: initialValues.scheduledTime ? dayjs(initialValues.scheduledTime, "HH:mm") : null,
    });
  }, [open, form, initialValues]);

  const handlePhoneLookup = async (digits: string) => {
    if (digits.length < 7) {
      setLookupStatus("idle");
      setPastAppointments([]);
      return;
    }

    setLookupStatus("searching");
    const result = await searchClientByPhone(digits);

    if (result.client) {
      setLookupStatus("found");
      setPastAppointments(result.appointments);

      // Auto-fill form with existing client data
      form.setFieldsValue({
        name: result.client.name,
        age: result.client.age || "",
        relative: result.client.relative || "",
        address: result.client.address || "",
        clientType: result.client.client_type as ClientType,
      });
    } else {
      setLookupStatus("not_found");
      setPastAppointments([]);
    }
  };

  const handleCountryChange = (country: Country) => {
    const countryCode = `+${getCountryCallingCode(country)}`;
    form.setFieldsValue({ country, countryCode });

    const phone = String(form.getFieldValue("phone") ?? "").replace(/\D/g, "");
    if (phone) {
      form.validateFields(["phone"]).catch(() => undefined);
    } else {
      form.setFields([
        {
          name: "phone",
          errors: [],
        },
      ]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { country, scheduledDate,scheduledTime, ...rest } = values;
      onSubmit({
        ...rest,
        countryCode: `+${getCountryCallingCode(country)}`,
        scheduledDate: scheduledDate
          ? dayjs(scheduledDate).format("YYYY-MM-DD")
          : undefined,
           scheduledTime: scheduledTime ? dayjs(scheduledTime).format("HH:mm") : undefined,
      });
    } catch {
      /* validation errors shown by antd */
    }
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        title={
          <span className="text-lg font-semibold capitalize tracking-wide text-[#144229]">
            {title}
          </span>
        }
        open={open}
        onCancel={onCancel}
        onOk={handleSubmit}
        okText={
          lookupStatus === "found" ? "Reschedule Appointment" : submitText
        }
        cancelText="Cancel"
        width="100%"
        style={{ maxWidth: 720, top: 16, paddingBottom: 0 }}
        className="px-3 sm:px-0"
        styles={{
          body: { maxHeight: "70vh", overflowY: "auto" },
        }}
        destroyOnHidden
        confirmLoading={loading}
        okButtonProps={{
          className:
            "h-11! bg-[#2D5A3F]! font-semibold! text-white! hover:bg-[#16482b]! hover:text-white!",
        }}
        cancelButtonProps={{
          className:
            "h-11! border-[#c1c9c0]! text-[#414942]! hover:border-[#2D5A3F]! hover:text-[#2D5A3F]!",
        }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={blankForm}
          className="pt-2 [&_.ant-form-item-label>label]:text-[13px]! [&_.ant-form-item-label>label]:font-medium! [&_.ant-form-item-label>label]:text-[#144229]!"
        >
          <Form.Item name="countryCode" hidden>
            <Input />
          </Form.Item>

          {/* Phone field FIRST so lookup happens before filling other fields */}
          <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
            <Form.Item
              label="Code"
              name="country"
              rules={[{ required: true, message: "Select country" }]}
            >
              <Select
                showSearch
                onChange={handleCountryChange}
                className="w-full [&_.ant-select-selector]:rounded-md!"
                classNames={{ popup: { root: selectPopupClassName } }}
                optionLabelProp="selected"
                filterOption={(input, option) =>
                  String(option?.search ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={countryOptions.map((option) => ({
                  ...option,
                  selected: <CountryOptionLabel country={option.value} />,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              validateFirst
              rules={[
                { required: true, message: "Phone is required" },
                {
                  validator: async (_, value) => {
                    const digits = String(value ?? "").replace(/\D/g, "");
                    if (!digits) return Promise.resolve();

                    const country =
                      (form.getFieldValue("country") as Country) || "IN";
                    const fullNumber = `+${getCountryCallingCode(country)}${digits}`;

                    if (!isValidPhoneNumber(fullNumber)) {
                      return Promise.reject(
                        new Error(
                          `Enter a valid ${en[country] ?? "country"} phone number`,
                        ),
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                inputMode="numeric"
                placeholder={
                  selectedCountry === "IN"
                    ? "10-digit mobile number"
                    : "Enter phone number"
                }
                className="rounded-md!"
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "");
                  form.setFieldValue("phone", digits);
                  handlePhoneLookup(digits);
                }}
              />
            </Form.Item>
          </div>

          {/* Returning client banner */}
          {lookupStatus === "found" && (
            <Alert
              type="success"
              showIcon
              className="mb-4!"
              title="Returning client found"
              description={
                <div>
                  <p className="m-0 text-sm">
                    Client details auto-filled. They have{" "}
                    <strong>{pastAppointments.length}</strong> previous
                    appointment{pastAppointments.length !== 1 ? "s" : ""}.
                  </p>
                  {pastAppointments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pastAppointments.map((apt) => (
                        <span
                          key={apt.id}
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            apt.status === "Accepted"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {apt.status} —{" "}
                          {new Date(apt.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              }
            />
          )}

          {lookupStatus === "searching" && (
            <p className="mb-4 text-xs text-[#414942]">
              Checking for existing client...
            </p>
          )}

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Input
                type="text"
                placeholder="Enter full name"
                className="rounded-md!"
                onChange={(event) => {
                  form.setFieldValue(
                    "name",
                    event.target.value.replace(/[^\p{L}\s]/gu, ""),
                  );
                }}
              />
            </Form.Item>

            <Form.Item
              label="Age"
              name="age"
              rules={[
                { required: true, message: "Age is required" },
                {
                  pattern: /^\d{1,3}$/,
                  message: "Age must be up to 3 digits",
                },
              ]}
            >
              <Input
                inputMode="numeric"
                maxLength={3}
                placeholder="e.g. 28"
                className="rounded-md!"
                onChange={(event) => {
                  const digits = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 3);
                  form.setFieldValue("age", digits);
                }}
              />
            </Form.Item>

            <Form.Item label="Relative's name and phone" name="relative">
              <Input
                placeholder="Enter relative's name and phone"
                className="rounded-md!"
              />
            </Form.Item>

            <Form.Item label="Client type" name="clientType">
              <Select
                className="w-full [&_.ant-select-selector]:rounded-md!"
                classNames={{ popup: { root: selectPopupClassName } }}
                options={[
                  { value: "Client", label: "Client" },
                  { value: "Student", label: "Student" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Address" name="address" className="sm:col-span-2">
              <Input.TextArea
                rows={3}
                placeholder="Enter address"
                className="min-h-24! rounded-md! resize-y!"
              />
            </Form.Item>
            <div className="grid grid-cols-1 gap-x-4 sm:col-span-2 sm:grid-cols-2">
              <Form.Item
                label="Appointment Date"
                name="scheduledDate"
                rules={[{ required: true, message: "Date is required" }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  className="w-full! rounded-md!"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  placeholder="Select date"
                />
              </Form.Item>

              <Form.Item
                label="Appointment Time"
                name="scheduledTime"
                rules={[{ required: true, message: "Time is required" }]}
              >
                <TimePicker
                  format="hh:mm A"
                  use12Hours
                  className="w-full! rounded-md!"
                  placeholder="Select time"
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
