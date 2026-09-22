import { Module } from "@nestjs/common";
import { EscrowService } from "./escrow.service";
import { ManualTransferProvider } from "./manual-transfer.provider";
import { PaymentsController } from "./payments.controller";
import { PayoutsService } from "./payouts.service";

@Module({
  controllers: [PaymentsController],
  providers: [EscrowService, PayoutsService, ManualTransferProvider],
  exports: [EscrowService, PayoutsService],
})
export class PaymentsModule {}
