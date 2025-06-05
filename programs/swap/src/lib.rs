pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("JAsfN61Cak6sz6HpDDzJZyFYMUFHD29f8vvc7ReYRJiW");

#[program]
pub mod swap {
    use super::*;

    pub fn make_offer(
        context: Context<MakeOffer>,
        id: u64,
        token_a_offered_amount: u64,
        token_b_wanted_amount: u64,
    ) -> Result<()> {
        instructions::make_offer::send_offered_tokens_to_vault(&context, token_a_offered_amount)?;
        instructions::make_offer::save_offer(context, id, token_b_wanted_amount,token_a_offered_amount)?;
        Ok(())
    }

    pub fn take_offer(context: Context<TakeOffer>) -> Result<()> {
        instructions::take_offer::send_wanted_tokens_to_maker(&context)?;
        instructions::take_offer::withdraw_and_close_vault(context)?;
        Ok(())
    }

//    pub fn increment_counter(ctx: Context<IncrementCounter>) -> Result<()> {
//         let counter = &mut ctx.accounts.counter;

//         // Only set authority once when first initialized
//         if counter.count == 0 {
//             counter.authority = *ctx.accounts.user.key;
//         }

//         counter.count += 1;
//         msg!("Counter incremented to: {}", counter.count);
//         Ok(())
//     }

//     pub fn get_counter(ctx: Context<GetCounter>) -> Result<()> {
//         let counter = &ctx.accounts.counter;
//         msg!("Counter value is: {}", counter.count);
//         Ok(())
//     }
}
