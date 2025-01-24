import db from "db";
import { partOptions, PartOptionType } from "db/schema/partOptions";
import { RulesService } from "services/rules/rules.service";

export class OptionsService {
  private rulesService = new RulesService();

  public async create(payload: any) {
    return db.insert(partOptions).values({ ...payload });
  }

  public async getPartOptionsWithRules(
    partId: string,
    selectedOptionsIds: string[]
  ): Promise<PartOptionType[]> {
    return this.rulesService.getPartOptionsWithRules(selectedOptionsIds, partId);
  }
}
