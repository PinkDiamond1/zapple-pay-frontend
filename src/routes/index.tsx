import {
  createForm,
  custom,
  getValue,
  required,
  reset,
} from "@modular-forms/solid";
import { Motion } from "@motionone/solid";
import { For, Show, createSignal } from "solid-js";
import { nip19 } from "nostr-tools";

const API_URL = import.meta.env.VITE_ZAPPLE_API_URL;

const EMOJI_OPTIONS = ["⚡️", "🤙", "👍", "❤️", "🫂"];

type ZappleForm = {
  npub: string;
  amount_sats: string;
  nwc: string;
  emoji: string;
};

export default function Home() {
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<Error>();
  const [saved, setSaved] = createSignal(false);
  const [zappleForm, { Form, Field }] = createForm<ZappleForm>({
    initialValues: {
      npub: "",
      amount_sats: "",
      nwc: "",
      emoji: "🤙",
    },
  });

  const handleSubmit = async (f: ZappleForm) => {
    const { npub, amount_sats, nwc, emoji } = f;
    setSaving(true);
    setError(undefined);

    const npubHex = nip19.decode(npub).data;

    try {
      const res = await fetch(`https://${API_URL}/set-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npub: npubHex,
          amount_sats: Number(amount_sats),
          nwc,
          emoji,
          donations: [],
        }),
      });

      if (res.ok) {
        console.log("saved");
        setSaved(true);
      } else {
        throw new Error("something went wrong");
      }
    } catch (e) {
      console.error(e);
      setError(e as Error);
    } finally {
      setSaving(false);
    }
  };

  // regex for just numbers
  const regex = /^[0-9]+$/;

  return (
    <main>
      <Motion.section
        initial={{ transform: "scaleY(0)" }}
        inView={{ transform: "scaleY(1)" }}
        class="h-[100vh] w-full flex flex-col items-center justify-center  bg-primary text-background"
      >
        <Motion.img
          src="/zapple-logo.svg"
          class="mx-auto h-[270px] w-[270px]"
        ></Motion.img>
      </Motion.section>
      <Show when={!saved()}>
        <Motion.section
          inView={{ opacity: 1 }}
          inViewOptions={{ amount: 0.5 }}
          initial={{ opacity: 0 }}
          class="min-h-[100vh] p-8 max-w-xl mx-auto flex flex-col justify-center"
        >
          <p class="mb-4">
            Zapple Pay lets you Zap from any nostr client. Just react to a{" "}
            <s>note</s>{" "}
            <span class="text-xl text-primary font-semibold">
              UnLoCkAbLe dIgItAl cOnTeNt
            </span>{" "}
            with a {getValue(zappleForm, "emoji")} emoji and Zapple Pay will
            notify your lightning wallet over NWC to pay the zap.
          </p>
          <Form onSubmit={handleSubmit} class="max-w-xl flex flex-col">
            <Field
              name="npub"
              validate={[
                required("Please enter an npub"),
                custom((value) => {
                  let decoded = nip19.decode(value!);
                  if (decoded.data) {
                    return true;
                  } else {
                    return false;
                  }
                }, "Please enter a valid npub"),
              ]}
            >
              {(field, props) => (
                <>
                  <label class="mb-0">your npub</label>
                  <label class="text-sm font-normal mt-0 opacity-75">
                    Zapple Pay will subscribe to reaction events on this npub
                  </label>
                  <input {...props} placeholder="npub1p4..." />
                  {field.error && <div class="text-red-500">{field.error}</div>}
                </>
              )}
            </Field>
            <Field name="emoji">
              {(field, props) => (
                <>
                  <label class="mb-0">trigger emoji</label>
                  <label class="text-sm font-normal mt-0 opacity-75">
                    Which reaction emoji do you want to trigger zaps? Damus uses
                    🤙 by default.
                  </label>
                  <select {...props}>
                    <For
                      each={EMOJI_OPTIONS.map((e) => {
                        return { label: e, value: e };
                      })}
                    >
                      {({ label, value }) => (
                        <option value={value} selected={field.value === value}>
                          {label}
                        </option>
                      )}
                    </For>
                  </select>
                  {field.error && <div class="text-red-500">{field.error}</div>}
                </>
              )}
            </Field>
            <Field
              name="amount_sats"
              validate={[
                required("Please enter an amount"),
                custom((value) => {
                  if (regex.test(value!)) {
                    return true;
                  } else {
                    return false;
                  }
                }, "Please enter a number"),
              ]}
            >
              {(field, props) => (
                <>
                  <label class="mb-0">zap amount</label>
                  <label class="text-sm font-normal mt-0 opacity-75">
                    How much to zap in sats per reaction
                  </label>
                  <input {...props} placeholder="420" />
                  {field.error && <div class="text-red-500">{field.error}</div>}
                </>
              )}
            </Field>
            <Field
              name="nwc"
              validate={[required("Please enter an nwc connection string")]}
            >
              {(field, props) => (
                <>
                  <label class="mb-0">nwc connection string</label>
                  <label class="text-sm font-normal mt-0 opacity-75">
                    Connect to your wallet with Nostr Wallet Connect to pay for
                    zaps
                  </label>
                  <textarea
                    {...props}
                    placeholder="nostr+walletconnect://7c30..."
                    rows="5"
                  />
                  {field.error && <div class="text-red-500">{field.error}</div>}
                </>
              )}
            </Field>
            <Show when={!!error()}>
              <p class="text-red-500">Error: {error()?.message}</p>
            </Show>

            <button
              type="submit"
              class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto"
            >
              {saving() ? "SAVING..." : "SAVE"}
            </button>
          </Form>
        </Motion.section>
      </Show>
      <Show when={saved()}>
        <Motion.section
          inView={{ opacity: 1 }}
          inViewOptions={{ amount: 0.5 }}
          initial={{ opacity: 0 }}
          class="min-h-[100vh] p-8 max-w-xl mx-auto flex flex-col justify-center items-center"
        >
          <h1 class="text-4xl font-bold mb-4">SAVED</h1>
          <button
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto"
            onClick={() => {
              reset(zappleForm);
              setSaved(false);
            }}
          >
            DO ANOTHER
          </button>
        </Motion.section>
      </Show>
    </main>
  );
}
