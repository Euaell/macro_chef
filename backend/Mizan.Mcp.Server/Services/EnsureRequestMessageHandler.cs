namespace Mizan.Mcp.Server.Services;

public sealed class EnsureRequestMessageHandler : DelegatingHandler
{
	protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
	{
		var response = await base.SendAsync(request, cancellationToken);
		if (response == null)
		{
			throw new InvalidOperationException("HTTP handler returned null response.");
		}
		if (response != null && response.RequestMessage == null)
		{
			response.RequestMessage = request;
		}
		return response;
	}
}
