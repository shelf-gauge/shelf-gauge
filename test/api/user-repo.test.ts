import { expect, db, factory, server, stub, HttpStatus } from "test/support";
import { Repo, RepoAuth, Suite } from "src/entity";
import * as loadCommits from "src/job/load-commits";

describe("API /user/repo", () => {
  db.setup();

  describe("/github GET", () => {
    it("returns repo data from github", async function() {
      const agent = await server.authRequest();
      const response = await agent.get("/user/repo/github");

      expect(response.status).to.equal(HttpStatus.Success.Ok);
      expect(response.body.data).to.deep.equal([
        {
          source: "github",
          name: "shelfgauge~shelfgauge",
          url: "https://github.com/shelfgauge/shelfgauge"
        }
      ]);
    });
  });

  describe("/github/:name GET", () => {
    it("fetches an existing repo", async function() {
      const agent = await server.authRequest();
      const existing = await factory.repo.create();
      const response = await agent.get(`/user/repo/github/${existing.name}`);

      expect(response.status).to.equal(HttpStatus.Success.Ok);
      expect(response.body.data).to.deep.equal({
        source: existing.source,
        name: existing.name,
        url: existing.url
      });
    });

    describe("missing repo", () => {
      it("returns data from github", async function() {
        const agent = await server.authRequest();
        const response = await agent.get(
          "/user/repo/github/shelfgauge~shelfgauge"
        );

        expect(response.status).to.equal(HttpStatus.Success.Ok);
        expect(response.body.data).to.deep.equal({
          source: "github",
          name: "shelfgauge~shelfgauge",
          url: "https://github.com/shelfgauge/shelfgauge"
        });

        expect(stub.service.github.fetchUserRepo).to.have.been.calledWith(
          agent.user.githubToken,
          "shelfgauge~shelfgauge"
        );
      });

      it("saves the repo", async function() {
        const agent = await server.authRequest();
        const response = await agent.get(
          "/user/repo/github/shelfgauge~shelfgauge"
        );

        const repo = await this.conn!.entityManager.findOne(Repo, {
          name: "shelfgauge~shelfgauge"
        });

        expect(repo).to.be.ok;
      });

      it("invokes the job loadCommits", async function() {
        const agent = await server.authRequest();
        const response = await agent.get(
          "/user/repo/github/shelfgauge~shelfgauge"
        );

        const repo = await this.conn!.entityManager.findOne(Repo, {
          name: "shelfgauge~shelfgauge"
        });

        expect(stub.job.loadCommits).to.have.been.calledWith(repo!.id);
      });
    });
  });

  describe("/:source/:name/auth POST", () => {
    it("rejects unaffiliated user", async function() {
      const agent = await server.authRequest();

      const repo = await factory.repo.create();

      const response = await agent.post(
        `/user/repo/${repo.source}/${repo.name}/auth`
      );

      expect(response.status).to.equal(HttpStatus.Error.Forbidden);
    });

    it("returns a new auth", async function() {
      const agent = await server.authRequest();

      const repo = await factory.repo.create({ users: [agent.user] });

      const response = await agent.post(
        `/user/repo/${repo.source}/${repo.name}/auth`
      );

      expect(response.status).to.equal(HttpStatus.Success.Created);

      const auth = await this.conn!.entityManager.findOne(RepoAuth);
      expect(response.body.data).to.have.property("authorization");
      expect(auth!.matches(response.body.data.authorization)).to.be.true;
    });
  });
});
