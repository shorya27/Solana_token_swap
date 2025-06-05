pub use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface,TransferChecked,transfer_checked};

// we need a lifetime here because we are borrowing variables here with &

// transfers the tokens from one token acc to another
pub fn transfer_tokens<'info>(
    from: &InterfaceAccount<'info, TokenAccount>, // works on old and nnew token program both
    to: &InterfaceAccount<'info, TokenAccount>,
    amount: &u64,
    mint:&InterfaceAccount<'info,Mint>,
    authority:&Signer<'info>,
    token_program: &Interface<'info,TokenInterface>
) -> Result<()> {
    let transfer_account_options=TransferChecked{
        from:from.to_account_info(),
        mint:mint.to_account_info(),
        to:to.to_account_info(),
        authority:authority.to_account_info(),
    };

    let cpi_context=CpiContext::new(token_program.to_account_info(),transfer_account_options);

    transfer_checked(cpi_context, *amount, mint.decimals);
    Ok(())
}
