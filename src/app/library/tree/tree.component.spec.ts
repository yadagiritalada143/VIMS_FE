import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TreeComponent } from './tree.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TreeComponent', () => {
  let component: TreeComponent;
  let fixture: ComponentFixture<TreeComponent>;
  CommonTestingModule.setUpTestBed(TreeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
