export async function fetchYouTubeData(channelUrl: string) {
  console.log("Fetching YouTube data for:", channelUrl);

  return {
    channelUrl,
    status: "mocked",
  };
}
