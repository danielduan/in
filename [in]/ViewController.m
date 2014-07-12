//
//  ViewController.m
//  [in]
//
//  Created by James Wu on 7/11/14.
//
//

#import "ViewController.h"
#import "AFNetworking.h"

@interface ViewController ()

@property (strong, nonatomic) IBOutlet UIButton *loginButton;
@property (strong, nonatomic) UIImageView *inmage;
@property (strong, nonatomic) UIView *loginPanel;
@property (strong, nonatomic) UITextField *username;
@property (strong, nonatomic) UITextField *password;
@property (strong, nonatomic) UIButton *sendButton;

@end

@implementation ViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
    UIColor *liColor = [UIColor colorWithRed:9/255.0f green:119/255.0f blue:182/255.0f alpha:1.0f];
    [self.view setBackgroundColor:liColor];
	self.loginButton.titleLabel.font = [UIFont systemFontOfSize:35.0];
    self.loginButton.titleLabel.textColor = [UIColor whiteColor];
    [self.loginButton addTarget:self action:@selector(changeView) forControlEvents:UIControlEventTouchUpInside];
    UIImage *image = [UIImage imageNamed:@"in.png"];
    self.inmage = [[UIImageView alloc] initWithFrame:CGRectMake((self.view.frame.size.width/2) - (image.size.width/2), (self.view.frame.size.height / 3) - (image.size.height / 2), image.size.width, image.size.height)];
    [self.inmage setImage:[UIImage imageNamed:@"in.png"]];
    [self.view addSubview:self.inmage];
    self.loginPanel = [[UIView alloc] init];
    [self.loginPanel setFrame:CGRectMake(0, self.view.frame.size.height, self.view.frame.size.width, self.view.frame.size.height * 2 / 3)];
    [self.loginPanel setBackgroundColor:[UIColor colorWithRed:235 green:235 blue:235 alpha:0.8]];
    [self.view addSubview:self.loginPanel];
    self.username = [[UITextField alloc] initWithFrame:CGRectMake(self.loginPanel.frame.size.width / 2 - 140, 20, 280, 40)];
    self.password = [[UITextField alloc] initWithFrame:CGRectMake(self.loginPanel.frame.size.width / 2 - 140, 80, 280, 40)];
    self.username.delegate = self;
    self.password.delegate = self;
    self.username.font = [UIFont systemFontOfSize:20.0];
    self.password.font = [UIFont systemFontOfSize:20.0];
    self.username.placeholder = @"Email";
    self.password.placeholder = @"Password";
    [self.username setReturnKeyType:UIReturnKeyNext];
    [self.password setReturnKeyType:UIReturnKeyGo];
    self.username.borderStyle = UITextBorderStyleRoundedRect;
    self.password.borderStyle = UITextBorderStyleRoundedRect;
    self.password.secureTextEntry = YES;
    [self.username resignFirstResponder];
    [self.password resignFirstResponder];
    [self.loginPanel addSubview:self.username];
    [self.loginPanel addSubview:self.password];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)changeView
{
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"apiToken"] == nil) {
        [UIView animateWithDuration:0.3 animations:^{
                CGRect frame = self.loginPanel.frame;
                frame.origin.y = self.view.frame.size.height / 3;
                self.loginPanel.frame = frame;

            }
            completion:^(BOOL finished){
                [self.username becomeFirstResponder];
            }
        ];
    } else {
        [self performSegueWithIdentifier:@"showMainView" sender:self];
    }
}

-(BOOL) NSStringIsValidEmail:(NSString *)checkString
{
    BOOL stricterFilter = YES; // Discussion http://blog.logichigh.com/2010/09/02/validating-an-e-mail-address/
    NSString *stricterFilterString = @"[A-Z0-9a-z\\._%+-]+@([A-Za-z0-9-]+\\.)+[A-Za-z]{2,4}";
    NSString *laxString = @".+@([A-Za-z0-9]+\\.)+[A-Za-z]{2}[A-Za-z]*";
    NSString *emailRegex = stricterFilter ? stricterFilterString : laxString;
    NSPredicate *emailTest = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    return [emailTest evaluateWithObject:checkString];
}

- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
    return YES;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    if ((textField == self.password && textField.text.length > 0 && self.username.text.length > 0) || (textField == self.username && textField.text.length > 0 && self.password.text.length > 0)) {
        if ([self NSStringIsValidEmail:self.username.text]) {
            NSDictionary *payload = [NSDictionary dictionaryWithObjects:@[self.username.text, self.password.text, [[NSUserDefaults standardUserDefaults] objectForKey:@"pushToken"]] forKeys:@[@"email", @"password", @"iphone_push_token"]];
            AFHTTPRequestOperationManager *manager = [AFHTTPRequestOperationManager manager];
            [manager GET:@"http://in-app.herokuapp.com/mobile/login" parameters:payload success:^(AFHTTPRequestOperation *operation, id responseObject) {
                NSLog(@"%@", responseObject);
                if ([[responseObject objectForKey:@"error"] length] > 0) {
                    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Error" message:[responseObject objectForKey:@"error"] delegate:nil cancelButtonTitle:@"Okay" otherButtonTitles:nil];
                    [alert show];
                } else if ([[responseObject objectForKey:@"mobile_auth_token"] length] > 0 && [[responseObject objectForKey:@"username"] length] > 0) {
                    [[NSUserDefaults standardUserDefaults] setObject:[responseObject objectForKey:@"mobile_auth_token"] forKey:@"apiToken"];
                    [self performSegueWithIdentifier:@"showMainView" sender:self];
                }
            } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
                NSLog(@"%@", error);
            }];
        } else {
            UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Error" message:@"Must enter a valid email" delegate:nil cancelButtonTitle:@"Okay" otherButtonTitles:nil];
            [alert show];
        }
    }
    return YES;
}

@end
