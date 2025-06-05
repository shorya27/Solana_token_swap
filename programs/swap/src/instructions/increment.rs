
use anchor_lang::prelude::*;
use crate::Counter;

#[derive(Accounts)]
pub struct IncrementCounter<'info> {
    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"counter"],
        bump,
        space = 8 + 8 + 32 // discriminator + u64 + pubkey
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetCounter<'info> {
    #[account(seeds = [b"counter"], bump)]
    pub counter: Account<'info, Counter>,
}
