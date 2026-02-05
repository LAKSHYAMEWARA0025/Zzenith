export async function fetchInstagramData(profileUrl: string) {
  console.log("Fetching Instagram data for:", profileUrl);

  return {
    profileUrl,
    status: "mocked",
  };
}
