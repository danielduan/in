//
//  InTableViewController.m
//  [in]
//
//  Created by James Wu on 7/12/14.
//
//

#import "InTableViewController.h"
#import "AFNetworking.h"

@interface InTableViewController ()

@property (strong, nonatomic) NSMutableArray *array;
@property (strong, nonatomic) UITextField *textField;

@end

@implementation InTableViewController

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    [self.tableView setBackgroundColor:[UIColor colorWithRed:9/255.0f green:119/255.0f blue:182/255.0f alpha:1.0f]];
    [self.tableView setContentInset:UIEdgeInsetsMake(20, 0, 0, 0)];
    self.tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    self.array = [[NSMutableArray alloc] init];
    AFHTTPRequestOperationManager *manager = [AFHTTPRequestOperationManager manager];
    [manager GET:@"http://in-app.herokuapp.com/mobile/get_friends/" parameters:@{@"mobile_auth_token": [[NSUserDefaults standardUserDefaults] stringForKey:@"apiToken"]} success:^(AFHTTPRequestOperation *operation, id responseObject) {
        if ([responseObject count] > 0) {
            NSLog(@"%@", responseObject);
            NSArray *array = [responseObject objectForKey:@"friends"];
            self.array = [[NSMutableArray alloc] initWithArray:array];
            [self.array addObject:@"+ add friend"];
            [self.tableView reloadData];
        } else {
            [self.array addObject:@"+ add friend"];
        }
    } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
    }];
}

- (void)viewDidAppear:(BOOL)animated
{
    [self.tableView reloadData];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    NSLog(@"array %@ has %d rows", self.array, [self.array count]);
    return [self.array count];
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    UITableViewCell *cell = [[UITableViewCell alloc] init];
    cell.textLabel.text = [self.array objectAtIndex:indexPath.row];
    cell.textLabel.font = [UIFont systemFontOfSize:50.0];
    cell.textLabel.textAlignment = NSTextAlignmentCenter;
    
    // Configure the cell...
    
    return cell;
}

// Override to support conditional editing of the table view.
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the specified item to be editable.
    return NO;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
    if ([cell.textLabel.text  isEqual: @"+ add friend"]) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Enter Username"
                                                        message:nil delegate:self cancelButtonTitle:@"Cancel" otherButtonTitles:@"Submit", nil];
        alert.alertViewStyle = UIAlertViewStylePlainTextInput;
        [alert show];
    } else {
        AFHTTPRequestOperationManager *manager = [AFHTTPRequestOperationManager manager];
        [manager GET:@"http://in-app.herokuapp.com/mobile/send/" parameters:@{@"mobile_auth_token": [[NSUserDefaults standardUserDefaults] stringForKey:@"apiToken"], @"recipient": cell.textLabel.text, @"message": @"[in]"} success:^(AFHTTPRequestOperation *operation, id responseObject) {
            NSLog(@"%@", responseObject);
        } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
            
        }];

    }
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 90.0;
}


/*
// Override to support editing the table view.
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // Delete the row from the data source
        [tableView deleteRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationFade];
    } else if (editingStyle == UITableViewCellEditingStyleInsert) {
        // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
    }   
}
*/

/*
// Override to support rearranging the table view.
- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{
}
*/

/*
// Override to support conditional rearranging of the table view.
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the item to be re-orderable.
    return YES;
}
*/

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 1) {
        AFHTTPRequestOperationManager *manager = [AFHTTPRequestOperationManager manager];
        [manager GET:@"http://in-app.herokuapp.com/mobile/save_friend/" parameters:@{@"mobile_auth_token": [[NSUserDefaults standardUserDefaults] stringForKey:@"apiToken"], @"friend": [alertView textFieldAtIndex:0].text} success:^(AFHTTPRequestOperation *operation, id responseObject) {
            NSLog(@"%@", responseObject);
            if ([responseObject objectForKey:@"success"]) {
                [self.array insertObject:[alertView textFieldAtIndex:0].text atIndex:[self.array count] - 1];
                [self.tableView reloadData];
            } else if ([[responseObject objectForKey:@"error"] length] > 0) {
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Error" message:[responseObject objectForKey:@"error"] delegate:nil cancelButtonTitle:@"Okay" otherButtonTitles:nil];
                [alert show];
            }
        } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
            
        }];

    }
}

@end
