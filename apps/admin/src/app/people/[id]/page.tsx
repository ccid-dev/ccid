import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePeopleManager } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { PersonForm } from "../PersonForm";
import { getAccountOptions } from "../data";

export const metadata: Metadata = { title: "구성원 편집" };

export default async function EditPersonPage({
  params,
}: PageProps<"/people/[id]">) {
  const me = await requirePeopleManager();
  const { id } = await params;
  const supabase = await createClient();
  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!person) notFound();
  const accounts = await getAccountOptions(person.admin_user_id);

  return (
    <PersonForm
      key={person.updated_at}
      person={person}
      accounts={accounts}
      isMine={person.admin_user_id === me.id}
    />
  );
}
